import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { CourseName } from '@/components/bits'
import { ProgramBar } from '@/components/ProgramBar'
import { PlusIcon, TimetableIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { currentPeriod, periodSlots, sortedCourses } from '@/core/calendar'
import { formatShort, type ISODate, startOfWeek, today } from '@/core/dates'
import { periodGrades } from '@/core/grading'
import { type Course, type Period, type ProfclickData, weeklyHours } from '@/core/model'
import { freeSlots } from '@/core/proposal'
import { programLine, topicProgress } from '@/core/progress'
import { courseSurface, formatHours, gradesLine } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'
import { CourseDialog } from './CourseDialog'

export default function CoursesPage() {
  const { data } = useData()
  const [, navigate] = useLocation()
  const [creating, setCreating] = useState(false)
  const now = today()
  const period = data.year ? currentPeriod(data.year, now) : undefined
  const courses = sortedCourses(data)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Classi</h1>
        <div className="flex gap-2">
          {courses.length > 0 && (
            <Button variant="outline" asChild>
              <Link to="/orario">
                <TimetableIcon /> Orario
              </Link>
            </Button>
          )}
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Nuova classe
          </Button>
        </div>
      </div>

      {courses.length === 0 && <p className="text-muted-foreground">Ancora nessuna classe. Creane una con il suo orario settimanale.</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const progress = topicProgress(data, course)
          const grades = period ? periodGrades(data, course, period, now) : undefined
          return (
            <Link key={course.id} to={`/classi/${course.id}`} style={courseSurface(course)} className="block space-y-3 rounded-xl border bg-card p-4 pl-5 shadow-xs transition-opacity hover:opacity-85">
              <div className="flex items-center justify-between gap-2">
                <CourseName course={course} className="font-semibold" />
                <span className="text-xs text-muted-foreground">{weeklyHours(course)} h/sett.</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span>Programma</span>
                  <span>{programLine(progress)}</span>
                </div>
                <ProgramBar progress={progress} />
              </div>
              {grades && period && (
                <div className="space-y-0.5 text-xs">
                  <p className={cn(grades.status === 'ok' ? 'text-muted-foreground' : grades.status === 'a-rischio' ? 'text-pencil-red' : 'text-warn')}>
                    Voti del {period.name}: {gradesLine(grades)}
                  </p>
                  {grades.civics.target > 0 && (
                    <p className={cn(grades.civics.planned >= grades.civics.target - 0.01 ? 'text-muted-foreground' : 'text-warn')}>
                      Ed. civica: {formatHours(grades.civics.planned)} su {grades.civics.target}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {grades.remainingLessons === 1 ? 'Resta una lezione' : `Restano ${grades.remainingLessons} lezioni`}
                    {planLine(data, course, period, now)}
                  </p>
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <CourseDialog open={creating} onClose={() => setCreating(false)} onSaved={(id) => navigate(`/classi/${id}`)} />
    </div>
  )
}

/** ": pianificato fino al 14/11, ancora 6 settimane": quanto manca da mettere in calendario nel periodo. */
function planLine(data: ProfclickData, course: Course, period: Period, now: ISODate): string {
  const free = freeSlots(data, course, period, now)
  const weeks = new Set(free.map((s) => startOfWeek(s.date))).size
  if (weeks === 0) return ', tutte pianificate'
  const count = weeks === 1 ? 'una settimana' : `${weeks} settimane`
  // Pianificato di seguito fino a una data: nessuna lezione già piena dopo la prima vuota.
  const planned = periodSlots(data, course, period).filter((s) => s.date >= now && s.lesson?.activities.length)
  const lastBefore = planned.filter((s) => s.date < free[0].date).at(-1)
  const contiguous = !planned.some((s) => s.date > free[0].date)
  if (contiguous && lastBefore) return `: pianificato fino al ${formatShort(lastBefore.date)}, ancora ${count}`
  return contiguous ? `: ancora ${count} da pianificare` : `: ${count} con lezioni ancora vuote`
}
