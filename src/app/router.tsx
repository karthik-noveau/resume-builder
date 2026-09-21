import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppLayout } from './AppLayout'
import { AppShell } from './AppShell'
import { RouteError } from '@/shared/components/errors/RouteError'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: (
      <div className="app-loading">
        <Spinner size={28} label="Opening your workspace…" />
      </div>
    ),
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { HomePage } = await import('@/features/marketing/pages/HomePage')
              return { Component: HomePage }
            },
          },
          {
            path: 'app',
            lazy: async () => {
              const { Dashboard } = await import('@/features/resume/pages/Dashboard')
              return { Component: Dashboard }
            },
          },
          {
            path: 'templates',
            lazy: async () => {
              const { TemplateGallery } = await import('@/features/templates/pages/TemplateGallery')
              return { Component: TemplateGallery }
            },
          },
          {
            path: 'settings',
            lazy: async () => {
              const { Settings } = await import('@/features/settings/pages/Settings')
              return { Component: Settings }
            },
          },
        ],
      },
      {
        path: 'editor/:resumeId',
        lazy: async () => {
          const { EditorPage } = await import('@/features/editor/pages/EditorPage')
          return { Component: EditorPage }
        },
      },
      {
        path: 'editor/:resumeId/guided',
        lazy: async () => {
          const { GuidedEditorPage } = await import('@/features/editor/pages/GuidedEditorPage')
          return { Component: GuidedEditorPage }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { NotFound } = await import('@/shared/pages/NotFound')
          return { Component: NotFound }
        },
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
