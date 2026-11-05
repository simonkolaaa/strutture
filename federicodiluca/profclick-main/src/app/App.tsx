import { lazy, Suspense } from 'react'
import { Redirect, Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { Toaster } from '@/components/ui/sonner'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { PencilFilters } from '@/components/pencil'
import { AuthProvider } from '@/state/auth'
import { DataProvider, useData } from '@/state/data'
import { Layout } from './Layout'

const WeekPage = lazy(() => import('@/features/week/WeekPage'))
const TodoPage = lazy(() => import('@/features/todo/TodoPage'))
const CoursesPage = lazy(() => import('@/features/courses/CoursesPage'))
const CoursePage = lazy(() => import('@/features/course/CoursePage'))
const NotesPage = lazy(() => import('@/features/notes/NotesPage'))
const MeetingsPage = lazy(() => import('@/features/meetings/MeetingsPage'))
const YearPage = lazy(() => import('@/features/year/YearPage'))
const TimetablePage = lazy(() => import('@/features/timetable/TimetablePage'))
const Welcome = lazy(() => import('@/features/welcome/Welcome'))

function Waiting() {
  return <p className="py-16 text-center text-muted-foreground">Carico…</p>
}

function Pages() {
  const { data } = useData()
  // Senza anno scolastico non c'è calendario: si parte dal benvenuto.
  if (!data.year) return <Welcome />
  return (
    <Switch>
      <Route path="/" component={WeekPage} />
      <Route path="/da-fare" component={TodoPage} />
      <Route path="/classi" component={CoursesPage} />
      <Route path="/classi/:id" component={CoursePage} />
      <Route path="/note" component={NotesPage} />
      {/* Il riepilogo per classe ora sta nelle schede di Classi (ADR 0023). */}
      <Route path="/riepilogo">
        <Redirect to="/classi" />
      </Route>
      <Route path="/riunioni" component={MeetingsPage} />
      <Route path="/anno" component={YearPage} />
      <Route path="/orario" component={TimetablePage} />
      <Route>
        <p className="py-16 text-center text-muted-foreground">Pagina non trovata.</p>
      </Route>
    </Switch>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        {/* Indirizzi con #: GitHub Pages serve solo file statici (ADR 0002). */}
        <Router hook={useHashLocation}>
          <Layout>
            <Suspense fallback={<Waiting />}>
              <Pages />
            </Suspense>
          </Layout>
        </Router>
      </DataProvider>
      <PencilFilters />
      <Toaster position="bottom-center" offset={{ bottom: 88 }} mobileOffset={{ bottom: 88 }} />
      {import.meta.env.PROD && <UpdatePrompt />}
    </AuthProvider>
  )
}
