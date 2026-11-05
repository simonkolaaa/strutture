import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { DailyPage } from '@/features/daily/DailyPage'
import { RecallPage } from '@/features/recall/RecallPage'
import { ExplorePage } from '@/features/explore/ExplorePage'
import { CollectionPage } from '@/features/explore/CollectionPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PlacementPage } from '@/features/placement/PlacementPage'
import { NotFoundPage } from '@/features/notfound/NotFoundPage'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <DailyPage /> },
        { path: 'ripasso', element: <RecallPage /> },
        { path: 'esplora', element: <ExplorePage /> },
        { path: 'esplora/:collectionId', element: <CollectionPage /> },
        { path: 'progressi', element: <ProgressPage /> },
        { path: 'impostazioni', element: <SettingsPage /> },
        { path: 'livello', element: <PlacementPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  // Vite's BASE_URL ("/": the app is served at the domain root).
  { basename: import.meta.env.BASE_URL },
)
