import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { AppShell } from './components/shell/AppShell';
import { FindingsScreen } from './components/findings/FindingsScreen';
import { ExperimentsScreen } from './components/experiments/ExperimentsScreen';
import { KnowledgeGraphScreen } from './components/graph/KnowledgeGraphScreen';
import { LineageScreen } from './components/lineage/LineageScreen';
import { FacetedSearchScreen } from './components/search/FacetedSearchScreen';
import { ChatWorkspaceScreen } from './components/chat/ChatWorkspaceScreen';
import { DesignSystemScreen } from './components/designsystem/DesignSystemScreen';
import { OverviewScreen } from './components/overview/OverviewScreen';
import { SystemStatusScreen } from './components/status/SystemStatusScreen';
import { StubScreen } from './components/stubs/StubScreen';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/findings" replace /> },
      { path: 'findings', element: <FindingsScreen /> },
      { path: 'experiments/*', element: <ExperimentsScreen /> },
      { path: 'overview', element: <OverviewScreen /> },
      { path: 'search', element: <FacetedSearchScreen /> },
      { path: 'graph', element: <KnowledgeGraphScreen /> },
      { path: 'lineage', element: <LineageScreen /> },
      { path: 'chat', element: <ChatWorkspaceScreen /> },
      { path: 'status', element: <SystemStatusScreen /> },
      { path: 'design', element: <DesignSystemScreen /> },
      { path: '*', element: <Navigate to="/findings" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
