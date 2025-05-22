import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <TooltipProvider>
      <App />
      <Toaster position="top-right" />
    </TooltipProvider>
  </AuthProvider>
);
