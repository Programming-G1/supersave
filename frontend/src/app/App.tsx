import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ModeProvider } from './contexts/ModeContext';

export default function App() {
  return (
    <ModeProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ModeProvider>
  );
}