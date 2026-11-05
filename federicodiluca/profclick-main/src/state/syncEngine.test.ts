import { describe, expect, it } from 'vitest'
import { addActivity, saveCourse } from '@/core/actions'
import { emptyData, type ProfclickData } from '@/core/model'
import { type DriveApi, SyncEngine } from './syncEngine'

/** Un Drive in memoria, con un numero di versione come quello vero. */
function fakeDrive() {
  const state: { file?: { data: ProfclickData; version: number } } = {}
  const api: DriveApi = {
    find: async () => (state.file ? { id: 'f', version: String(state.file.version) } : null),
    getVersion: async () => (state.file ? String(state.file.version) : null),
    read: async () => structuredClone(state.file!.data),
    create: async (_t, data) => {
      state.file = { data: structuredClone(data), version: 1 }
      return { id: 'f', version: '1' }
    },
    update: async (_t, _id, data) => {
      state.file = { data: structuredClone(data), version: state.file!.version + 1 }
      return String(state.file.version)
    },
  }
  return { api, state }
}

function engine(drive: DriveApi) {
  return new SyncEngine({ data: emptyData(), meta: { dirty: true }, drive, saveData: () => {}, saveMeta: () => {}, onUnauthorized: () => {} })
}

const course = (id: string) => ({
  id,
  className: id,
  subject: '',
  color: 0,
  schedule: [],
  pastSchedules: [],
  civics: {},
  periodNotes: {},
  prep: [],
  rules: { perPeriod: null, required: [], minorWeight: 50 },
  order: 0,
})

describe('sincronizzazione', () => {
  it('unisce le modifiche di due dispositivi senza perderne', async () => {
    const drive = fakeDrive()
    const pc = engine(drive.api)
    const phone = engine(drive.api)

    pc.apply(saveCourse(course('3A')))
    await pc.sync('t')
    await phone.sync('t')
    expect(Object.keys(phone.getSnapshot().data.courses)).toEqual(['3A'])

    // Entrambi modificano offline, poi sincronizzano uno dopo l'altro.
    pc.apply(addActivity('3A', '2026-10-05', { id: 'a', kind: 'ripasso', topicIds: [], text: '' }))
    phone.apply(saveCourse(course('4B')))
    await phone.sync('t')
    await pc.sync('t')
    await phone.sync('t')

    for (const device of [pc, phone]) {
      const data = device.getSnapshot().data
      expect(Object.keys(data.courses).sort()).toEqual(['3A', '4B'])
      expect(Object.keys(data.lessons)).toHaveLength(1)
      expect(device.getSnapshot().sync.state).toBe('synced')
    }
    expect(Object.keys(drive.state.file!.data.courses).sort()).toEqual(['3A', '4B'])
  })

  it('non riscrive il file se non è cambiato niente', async () => {
    const drive = fakeDrive()
    const pc = engine(drive.api)
    await pc.sync('t')
    await pc.sync('t')
    expect(drive.state.file!.version).toBe(1)
  })
})
