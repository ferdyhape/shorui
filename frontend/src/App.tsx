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
import { MobileTopBar } from './components/navigation/MobileTopBar'
import { PageHeader } from './components/navigation/PageHeader'
import { Sidebar, type SidebarSection } from './components/navigation/Sidebar'
import { ThemeToggle } from './components/navigation/ThemeToggle'
import { minWidthQuery } from './lib/breakpoints'
import { useMediaQuery } from './lib/useMediaQuery'
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
  const isDesktop = useMediaQuery(minWidthQuery('md'))
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeId = pathname.split('/')[1]
  const drawerVisible = drawerOpen && !isDesktop

  useEffect(() => {
    const tool = tools.find((t) => t.id === activeId)
    document.title = tool ? `${tool.name} · Shorui` : 'Shorui'
  }, [activeId])

  useEffect(() => {
    if (!drawerVisible) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerVisible])

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
    <div className="flex h-dvh flex-col overflow-hidden bg-surface md:flex-row">
      <MobileTopBar open={drawerVisible} onToggle={() => setDrawerOpen((o) => !o)} />

      {drawerVisible && (
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-surface-inverse/50 md:hidden"
        />
      )}

      {/* Below md the sidebar is an off-canvas drawer; from md up it is a permanent column.
          `invisible` keeps the closed drawer out of the tab order and screen readers. */}
      <div
        id="app-navigation"
        className={`fixed inset-y-0 left-0 z-40 max-w-[85vw] transition-[transform,visibility] duration-[var(--duration-normal)] md:visible md:static md:z-auto md:max-w-none md:translate-x-0 ${
          drawerVisible ? 'visible translate-x-0 shadow-overlay' : 'invisible -translate-x-full'
        }`}
      >
        <Sidebar
          sections={SECTIONS}
          activeId={activeId}
          onSelect={(id) => {
            setDrawerOpen(false)
            navigate(`/${id}`)
          }}
          collapsed={isDesktop && collapsed}
          onToggleCollapse={isDesktop ? toggleCollapsed : undefined}
          footer={
            <div className="flex flex-col gap-2.5">
              <Credit />
              <ThemeToggle />
            </div>
          }
        />
      </div>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
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
