import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import ModeSelection from './pages/ModeSelection';
import Dashboard from './pages/Dashboard';
import HospitalDetail from './pages/HospitalDetail';
import TransferRequest from './pages/TransferRequest';
import HospitalManager from './pages/HospitalManager';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ModeSelection />,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { path: 'dashboard/:userMode', Component: Dashboard },
      { path: 'hospital/:id', Component: HospitalDetail },
      { path: 'transfer', Component: TransferRequest },
      { path: 'hospital-manager', Component: HospitalManager },
    ],
  },
]);
