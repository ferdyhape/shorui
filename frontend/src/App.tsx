import { Suspense, useEffect, useState } from 'react'
import {
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Credit } from './components/navigation/Credit'
import { PageHeader } from './components/navigation/PageHeader'
import { Sidebar, type SidebarSection } from './components/navigation/Sidebar'
import { ThemeToggle } from './components/navigation/ThemeToggle'
import { tools, type Tool } from './tools'

const SECTIONS: SidebarSection[] = [
  {
    label: 'Tools',
    items: tools.map(({ id, name, icon }) => ({ id, label: name, icon })),
  },
]

const SIDEBAR_COLLAPSED_KEY = 'shorui:sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function Shell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const activeId = pathname.split('/')[1]

  useEffect(() => {
    const tool = tools.find((t) => t.id === activeId)
    document.title = tool ? `${tool.name} · Shorui` : 'Shorui'
  }, [activeId])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!prev))
      } catch {
        // Per-viewer preference only; failing to persist is fine.
      }
      return !prev
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        sections={SECTIONS}
        activeId={activeId}
        onSelect={(id) => navigate(`/${id}`)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        footer={
          <div className="flex flex-col gap-2.5">
            <Credit />
            <ThemeToggle />
          </div>
        }
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

function ToolPage({ tool }: { tool: Tool }) {
  const ToolComponent = tool.component
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <div className="px-[var(--page-gutter)] py-6">
        <Suspense fallback={<p className="text-body-sm text-ink-faint">Loading…</p>}>
          <ToolComponent />
        </Suspense>
      </div>
    </>
  )
}

export default function App() {
  const home = tools[0] ? `/${tools[0].id}` : '/'
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Navigate to={home} replace />} />
          {tools.map((tool) => (
            <Route key={tool.id} path={tool.id} element={<ToolPage tool={tool} />} />
          ))}
          <Route path="*" element={<Navigate to={home} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
