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

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat', element: <ChatWorkspaceScreen /> },
      { path: 'findings', element: <FindingsScreen /> },
      { path: 'experiments/*', element: <ExperimentsScreen /> },
      { path: 'overview', element: <OverviewScreen /> },
      { path: 'search', element: <FacetedSearchScreen /> },
      { path: 'graph', element: <KnowledgeGraphScreen /> },
      { path: 'lineage', element: <LineageScreen /> },
      { path: 'design', element: <DesignSystemScreen /> },
      { path: '*', element: <Navigate to="/chat" replace /> },
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
