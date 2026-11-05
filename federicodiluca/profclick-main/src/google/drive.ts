// Il file dei dati sul Drive dell'utente (ADR 0003). Con lo scope drive.file l'app vede
// solo i file che ha creato lei: la ricerca per nome non trova mai file altrui, e da un
// altro dispositivo con lo stesso account ritrova lo stesso file. Il file è visibile nel
// Drive: è anche un backup leggibile, che si può scaricare o condividere.

import { type ProfclickData, normalizeData } from '@/core/model'
import { GoogleApiError, googleFetch, withParams } from './http'

const API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const FILE_NAME = 'profclick-dati.json'

export interface RemoteFile {
  id: string
  /** Numero che Google incrementa a ogni modifica del file. */
  version: string
}

/** Il file dei dati, se esiste e non è nel cestino. */
export async function findDataFile(token: string): Promise<RemoteFile | null> {
  const url = withParams(API, {
    q: `name = '${FILE_NAME}' and trashed = false`,
    spaces: 'drive',
    orderBy: 'createdTime',
    fields: 'files(id,version)',
  })
  const { files }: { files: RemoteFile[] } = await (await googleFetch(token, url)).json()
  return files[0] ?? null
}

/** La versione attuale del file, o null se è stato cancellato o messo nel cestino. */
export async function getVersion(token: string, fileId: string): Promise<string | null> {
  try {
    const url = withParams(`${API}/${fileId}`, { fields: 'version,trashed' })
    const file: { version: string; trashed: boolean } = await (await googleFetch(token, url)).json()
    return file.trashed ? null : file.version
  } catch (e) {
    if (e instanceof GoogleApiError && e.status === 404) return null
    throw e
  }
}

export async function readDataFile(token: string, fileId: string): Promise<ProfclickData> {
  const response = await googleFetch(token, withParams(`${API}/${fileId}`, { alt: 'media' }))
  return normalizeData(await response.json())
}

function serialize(data: ProfclickData): string {
  return JSON.stringify(data, null, 2)
}

export async function createDataFile(token: string, data: ProfclickData): Promise<RemoteFile> {
  // Upload "multipart": metadati e contenuto in una sola richiesta, separati da un boundary.
  const boundary = `profclick-${crypto.randomUUID()}`
  const metadata = { name: FILE_NAME, mimeType: 'application/json', description: 'Dati di ProfClick: classi, programma e piano delle lezioni.' }
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    serialize(data),
    `--${boundary}--`,
  ].join('\r\n')
  const url = withParams(UPLOAD, { uploadType: 'multipart', fields: 'id,version' })
  const response = await googleFetch(token, url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  return response.json()
}

/** Sovrascrive il contenuto del file e restituisce la nuova versione. */
export async function updateDataFile(token: string, fileId: string, data: ProfclickData): Promise<string> {
  const url = withParams(`${UPLOAD}/${fileId}`, { uploadType: 'media', fields: 'version' })
  const response = await googleFetch(token, url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: serialize(data),
  })
  const { version }: { version: string } = await response.json()
  return version
}
