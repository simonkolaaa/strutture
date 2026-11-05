import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { initProgress } from '@/state/store'
import { initInstall } from '@/core/install'
import { AppearanceEffect } from '@/app/AppearanceEffect'
import { router } from '@/app/router'
import './index.css'

initProgress()
initInstall()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppearanceEffect />
    <RouterProvider router={router} />
  </StrictMode>,
)
