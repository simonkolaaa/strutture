import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { copyProgram } from '@/core/actions'
import { type ProgramSource, programSources } from '@/core/archive'
import type { Course } from '@/core/model'
import { newId } from '@/lib/id'
import { useData } from '@/state/data'

/** Il programma di un'altra classe, di quest'anno o di un anno passato, in un tocco. */
export function CopyProgramDialog({ course, open, onClose }: { course: Course; open: boolean; onClose: () => void }) {
  const { data, applyWithUndo } = useData()
  const sources = open ? programSources(data, course.id) : []
  const groups = [...new Set(sources.map((s) => s.yearLabel))]

  const copy = (source: ProgramSource) => {
    applyWithUndo(copyProgram(source, course.id, newId), `Programma copiato da ${source.label}${source.yearLabel ? ` (${source.yearLabel})` : ''}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Copia il programma</DialogTitle>
          <DialogDescription>
            Argomenti, sotto-punti e valutazioni previste, tutti da fare, nello stesso periodo. Poi li ritocchi per {course.className}.
          </DialogDescription>
        </DialogHeader>
        {groups.map((group) => (
          <section key={group ?? 'now'} className="space-y-2">
            <h3 className="text-sm font-semibold">{group ? `Anno ${group}` : "Quest'anno"}</h3>
            <ul className="divide-y rounded-xl border bg-card">
              {sources
                .filter((s) => s.yearLabel === group)
                .map((s) => (
                  <li key={s.key}>
                    <button type="button" onClick={() => copy(s)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50">
                      <span className="font-medium">{s.label}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.topics.length} {s.topics.length === 1 ? 'argomento' : 'argomenti'}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  )
}
