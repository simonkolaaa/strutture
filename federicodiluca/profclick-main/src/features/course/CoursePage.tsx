import { useState } from 'react'
import { useLocation, useParams } from 'wouter'
import { CourseName, Segmented } from '@/components/bits'
import { EditIcon, GradesIcon, type IconComponent, NoteIcon, ProgramIcon, TrashIcon, WeekIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteCourse } from '@/core/actions'
import { weeklyHours } from '@/core/model'
import { courseTopics } from '@/core/progress'
import { CourseDialog } from '@/features/courses/CourseDialog'
import { useData } from '@/state/data'
import { GradesTab } from './GradesTab'
import { NotesTab } from './NotesTab'
import { PlanTab } from './PlanTab'
import { ProgramTab } from './ProgramTab'

type Tab = 'piano' | 'programma' | 'voti' | 'appunti'

const TABS: { value: Tab; label: string; icon: IconComponent }[] = [
  { value: 'piano', label: 'Piano', icon: WeekIcon },
  { value: 'programma', label: 'Programma', icon: ProgramIcon },
  { value: 'voti', label: 'Voti', icon: GradesIcon },
  { value: 'appunti', label: 'Appunti', icon: NoteIcon },
]

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const { data, applyWithUndo } = useData()
  const [, navigate] = useLocation()
  const course = data.courses[id]
  // Una classe appena creata parte dal programma: senza argomenti il piano è vuoto.
  const [tab, setTab] = useState<Tab>(() => (courseTopics(data, id).length === 0 ? 'programma' : 'piano'))
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!course) return <p className="py-16 text-center text-muted-foreground">Classe non trovata.</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            <CourseName course={course} />
          </h1>
          <p className="text-sm text-muted-foreground">{weeklyHours(course)} ore a settimana</p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <EditIcon /> Orario e regole
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Elimina classe" onClick={() => setConfirmDelete(true)}>
            <TrashIcon />
          </Button>
        </div>
      </div>

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        className="w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none"
        options={TABS.map((t) => ({
          value: t.value,
          label: (
            <span className="flex items-center justify-center gap-1.5">
              <t.icon className="hidden size-4 sm:block" />
              {t.label}
            </span>
          ),
        }))}
      />

      {tab === 'piano' && <PlanTab course={course} onShowGrades={() => setTab('voti')} />}
      {tab === 'programma' && <ProgramTab course={course} />}
      {tab === 'voti' && <GradesTab course={course} />}
      {tab === 'appunti' && <NotesTab course={course} />}

      <CourseDialog open={editing} course={course} onClose={() => setEditing(false)} />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {course.className}?</AlertDialogTitle>
            <AlertDialogDescription>Spariscono anche il suo programma e il piano delle lezioni.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                navigate('/classi')
                applyWithUndo(deleteCourse(course.id), `${course.className} eliminata`)
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
