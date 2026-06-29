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
  // Legacy /chat now points at /experiments to honour the post-login redirect contract.
  { path: 'chat', element: <Navigate to="/experiments" replace /> },
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
  { path: '*', element: <Navigate to="/experiments" replace /> },
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
