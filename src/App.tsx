
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { shouldUseSimplifiedComponents } from '@/utils/tizenCompatibility';
import TizenLayout from '@/components/tizen/TizenLayout';
import '@/polyfills';
import './App.css';

// Import your existing components
import Layout from '@/components/layout/Layout';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Ordens from '@/pages/Ordens';
import OrdemDetalhes from '@/pages/OrdemDetalhes';
import NovaOrdem from '@/pages/NovaOrdem';
import Clientes from '@/pages/Clientes';
import ClienteCadastro from '@/pages/ClienteCadastro';
import Funcionarios from '@/pages/Funcionarios';
import Motores from '@/pages/Motores';
import Relatorios from '@/pages/Relatorios';
import RelatoriosProducao from '@/pages/RelatoriosProducao';
import RelatoriosFinanceiro from '@/pages/RelatoriosFinanceiro';
import Configuracoes from '@/pages/Configuracoes';
import ConfiguracoesAtividades from '@/pages/ConfiguracoesAtividades';
import SubatividadesConfig from '@/pages/SubatividadesConfig';
import SubatividadesReset from '@/pages/SubatividadesReset';
import Agenda from '@/pages/Agenda';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Routes component
const AppRoutes = () => {
  const deviceInfo = useDeviceDetection();
  
  // Use simplified components for Tizen/legacy devices
  if (shouldUseSimplifiedComponents(deviceInfo)) {
    return <TizenLayout />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/ordens" element={<ProtectedRoute><Layout><Ordens /></Layout></ProtectedRoute>} />
      <Route path="/ordens/nova" element={<ProtectedRoute><Layout><NovaOrdem /></Layout></ProtectedRoute>} />
      <Route path="/ordens/:id" element={<ProtectedRoute><Layout><OrdemDetalhes /></Layout></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
      <Route path="/clientes/novo" element={<ProtectedRoute><Layout><ClienteCadastro /></Layout></ProtectedRoute>} />
      <Route path="/clientes/:id" element={<ProtectedRoute><Layout><ClienteCadastro /></Layout></ProtectedRoute>} />
      <Route path="/funcionarios" element={<ProtectedRoute><Layout><Funcionarios /></Layout></ProtectedRoute>} />
      <Route path="/motores" element={<ProtectedRoute><Layout><Motores /></Layout></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} />
      <Route path="/relatorios/producao" element={<ProtectedRoute><Layout><RelatoriosProducao /></Layout></ProtectedRoute>} />
      <Route path="/relatorios/financeiro" element={<ProtectedRoute><Layout><RelatoriosFinanceiro /></Layout></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
      <Route path="/configuracoes/atividades" element={<ProtectedRoute><Layout><ConfiguracoesAtividades /></Layout></ProtectedRoute>} />
      <Route path="/subatividades" element={<ProtectedRoute><Layout><SubatividadesConfig /></Layout></ProtectedRoute>} />
      <Route path="/subatividades/reset" element={<ProtectedRoute><Layout><SubatividadesReset /></Layout></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><Layout><Agenda /></Layout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Create ProtectedRoute component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // You can add authentication logic here
  return <>{children}</>;
};

function App() {
  const deviceInfo = useDeviceDetection();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
