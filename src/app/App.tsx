import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './data/auth';
import { AppShell } from './components/shell/AppShell';
import { RouteErrorBoundary } from './components/shell/RouteErrorBoundary';
import { ChatWorkspaceScreen } from './components/chat/ChatWorkspaceScreen';
import { FindingsScreen } from './components/findings/FindingsScreen';

const ExperimentsScreen = lazy(() => import('./components/experiments/ExperimentsScreen').then(m => ({ default: m.ExperimentsScreen })));
const InOutScreen = lazy(() => import('./components/inout/InOutScreen').then(m => ({ default: m.InOutScreen })));
const KnowledgeGraphScreen = lazy(() => import('./components/graph/KnowledgeGraphScreen').then(m => ({ default: m.KnowledgeGraphScreen })));

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
  // Authenticated root lands on Experiments (the main landing page after login).
  { index: true, element: <Navigate to="/experiments" replace /> },
  // Chat is a first-class destination — keep its route live so the sidebar
  // item, direct URLs, refresh, and Back/Forward all work.
  { path: 'chat', element: <ChatWorkspaceScreen /> },
  { path: 'findings', element: <FindingsScreen /> },
  {
    path: 'experiments/*',
    element: <SuspenseWrapper><ExperimentsScreen /></SuspenseWrapper>,
  },
  {
    path: 'in-out',
    element: <SuspenseWrapper><InOutScreen /></SuspenseWrapper>,
  },
  {
    path: 'in-out/:slug',
    element: <SuspenseWrapper><InOutScreen /></SuspenseWrapper>,
  },
  {
    path: 'graph',
    element: <SuspenseWrapper><KnowledgeGraphScreen /></SuspenseWrapper>,
  },
  // Legacy routes — preserve bookmarks by redirecting rather than 404-ing.
  { path: 'overview', element: <Navigate to="/experiments" replace /> },
  { path: 'search', element: <Navigate to="/in-out" replace /> },
  { path: 'lineage', element: <Navigate to="/in-out" replace /> },
  // Tolerate the previous malformed `/experiments/experiments/<id>` URLs
  // by stripping the duplicated segment and redirecting to the canonical route.
  { path: 'experiments/experiments/*', element: <RedirectDuplicatedExperimentRoute /> },
  { path: '*', element: <Navigate to="/experiments" replace /> },
];

// Dev-only design system route
if (import.meta.env.DEV) {
  const DesignSystemScreen = lazy(() => import('./components/designsystem/DesignSystemScreen').then(m => ({ default: m.DesignSystemScreen })));
  children.splice(children.length - 1, 0, {
    path: 'design',
    element: <SuspenseWrapper><DesignSystemScreen /></SuspenseWrapper>,
  } as (typeof children)[number]);
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorBoundary routeKey="root" />,
    children,
  },
]);

function RedirectDuplicatedExperimentRoute() {
  // The previous implementation generated `/experiments/experiments/<slug>`
  // because the slug already includes the `experiments/` prefix. This
  // component gracefully redirects those legacy URLs to the canonical route.
  return <NavigateToCanonicalExperiment />;
}

import { useParams } from 'react-router';
import { canonicalExperimentPath } from './data/routes';

function NavigateToCanonicalExperiment() {
  const params = useParams();
  const rest = params['*'] ?? '';
  // The duplicated segment looks like `experiments/<date>_<name>`. Strip a
  // leading `experiments/` if present, then build the canonical path.
  const normalized = rest.replace(/^experiments\//, '');
  return <Navigate to={canonicalExperimentPath(normalized)} replace />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
