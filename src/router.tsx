import { createBrowserRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ImageProcessor from './pages/ImageProcessor';
import RuleConfig from './pages/RuleConfig';
import History from './pages/History';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/processor',
    element: <ImageProcessor />,
  },
  {
    path: '/rules',
    element: <RuleConfig />,
  },
  {
    path: '/history',
    element: <History />,
  },
]);
