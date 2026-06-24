import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './data/auth';
import { AppShell } from './components/shell/AppShell';
import { RouteErrorBoundary } from './components/shell/RouteErrorBoundary';
import { ChatWorkspaceScreen } from './components/chat/ChatWorkspaceScreen';
import { FindingsScreen } from './components/findings/FindingsScreen';
import { OverviewScreen } from './components/overview/OverviewScreen';

const ExperimentsScreen = lazy(() => import('./components/experiments/ExperimentsScreen').then(m => ({ default: m.ExperimentsScreen })));
const FacetedSearchScreen = lazy(() => import('./components/search/FacetedSearchScreen').then(m => ({ default: m.FacetedSearchScreen })));
const KnowledgeGraphScreen = lazy(() => import('./components/graph/KnowledgeGraphScreen').then(m => ({ default: m.KnowledgeGraphScreen })));
const LineageScreen = lazy(() => import('./components/lineage/LineageScreen').then(m => ({ default: m.LineageScreen })));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-[13px] text-text-muted">Loading…</div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const children = [
  { index: true, element: <Navigate to="/chat" replace /> },
  { path: 'chat', element: <ChatWorkspaceScreen /> },
  { path: 'findings', element: <FindingsScreen /> },
  {
    path: 'experiments/*',
    element: <SuspenseWrapper><ExperimentsScreen /></SuspenseWrapper>,
  },
  { path: 'overview', element: <OverviewScreen /> },
  {
    path: 'search',
    element: <SuspenseWrapper><FacetedSearchScreen /></SuspenseWrapper>,
  },
  {
    path: 'graph',
    element: <SuspenseWrapper><KnowledgeGraphScreen /></SuspenseWrapper>,
  },
  {
    path: 'lineage',
    element: <SuspenseWrapper><LineageScreen /></SuspenseWrapper>,
  },
  { path: '*', element: <Navigate to="/chat" replace /> },
];

// Dev-only design system route
if (import.meta.env.DEV) {
  const DesignSystemScreen = lazy(() => import('./components/designsystem/DesignSystemScreen').then(m => ({ default: m.DesignSystemScreen })));
  children.splice(children.length - 1, 0, {
    path: 'design',
    element: <SuspenseWrapper><DesignSystemScreen /></SuspenseWrapper>,
  } as never);
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorBoundary routeKey="root" />,
    children,
  },
]);

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
