import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getOptimizedQueryConfig, logTizenInfo, shouldUseSimplifiedComponents } from "@/utils/tizenCompatibility";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

// Import polyfills for Tizen compatibility
import "@/polyfills";

// Regular components
import Dashboard from "./pages/Dashboard";
import Ordens from "./pages/Ordens";
import NovaOrdem from "./pages/NovaOrdem";
import Funcionarios from "./pages/Funcionarios";
import NotFound from "./pages/NotFound";
import OrdemDetalhes from "./pages/OrdemDetalhes";
import Clientes from "./pages/Clientes";
import ClienteCadastro from "./pages/ClienteCadastro";
import Motores from "./pages/Motores";
import Agenda from "./pages/Agenda";
import RelatoriosProducao from "./pages/RelatoriosProducao";
import RelatoriosFinanceiro from "./pages/RelatoriosFinanceiro";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";

// Simplified Tizen components
import TizenDashboard from "./components/tizen/TizenDashboard";

// Authentication guard component
const PrivateRoute = ({ children, requiredPermission = "visualizacao" }: { 
  children: React.ReactNode;
  requiredPermission?: string;
}) => {
  const { user, loading, hasPermission, canAccessRoute } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has permission for this specific route
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has the required permission level
  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { logout } = useAuth();
  const deviceInfo = useDeviceDetection();
  const useSimplified = shouldUseSimplifiedComponents(deviceInfo);
  
  const handleLogout = () => {
    logout();
  };

  // Log device info for debugging
  useEffect(() => {
    logTizenInfo(deviceInfo);
  }, [deviceInfo]);

  // Show compatibility notice for Tizen users
  useEffect(() => {
    if (deviceInfo.isTizen) {
      console.log('Running on Tizen OS - using simplified interface');
      
      // Show a brief notification (non-blocking)
      const notice = document.createElement('div');
      notice.innerHTML = 'Modo compatibilidade TV ativado';
      notice.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
      `;
      document.body.appendChild(notice);
      
      setTimeout(() => {
        document.body.removeChild(notice);
      }, 3000);
    }
  }, [deviceInfo.isTizen]);
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Dashboard - use simplified version for Tizen */}
      <Route path="/" element={
        <PrivateRoute>
          {useSimplified ? (
            <TizenDashboard onLogout={handleLogout} />
          ) : (
            <Dashboard onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          {useSimplified ? (
            <TizenDashboard onLogout={handleLogout} />
          ) : (
            <Dashboard onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* For now, only Dashboard has Tizen version - other routes show message */}
      <Route path="/ordens" element={
        <PrivateRoute>
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade disponível apenas no Dashboard</h2>
              <p>Use o Dashboard para visualizar informações principais</p>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Ordens onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Criação de Ordens - apenas gerente ou superior */}
      <Route path="/ordens/nova" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <NovaOrdem onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Detalhes de Ordens - técnicos ou superior */}
      <Route path="/ordens/:id" element={
        <PrivateRoute requiredPermission="tecnico">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <OrdemDetalhes onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Funcionários - gerentes ou superior */}
      <Route path="/funcionarios" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Funcionarios onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Edição do próprio perfil - todos os níveis */}
      <Route path="/funcionarios/editar/:id" element={
        <PrivateRoute requiredPermission="tecnico">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Funcionarios onLogout={handleLogout} meuPerfil={true} />
          )}
        </PrivateRoute>
      } />
      
      {/* Clientes - gerentes ou superior */}
      <Route path="/clientes" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Clientes onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      <Route path="/clientes/cadastro" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <ClienteCadastro onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      <Route path="/clientes/editar/:id" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <ClienteCadastro onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Motores - gerentes ou superior */}
      <Route path="/motores" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Motores onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Agenda - gerentes ou superior */}
      <Route path="/agenda" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Agenda onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Redirecionar /subatividades para /configuracoes */}
      <Route path="/subatividades" element={
        <Navigate to="/configuracoes" replace />
      } />
      
      {/* Relatórios de Produção - gerentes ou superior */}
      <Route path="/relatorios/producao" element={
        <PrivateRoute requiredPermission="gerente">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <RelatoriosProducao />
          )}
        </PrivateRoute>
      } />
      
      {/* Relatórios Financeiros - apenas administradores */}
      <Route path="/relatorios/financeiro" element={
        <PrivateRoute requiredPermission="admin">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <RelatoriosFinanceiro onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      {/* Redirecionar /relatorios para /relatorios/producao */}
      <Route path="/relatorios" element={
        <Navigate to="/relatorios/producao" replace />
      } />
      
      {/* Configurações - apenas administradores */}
      <Route path="/configuracoes" element={
        <PrivateRoute requiredPermission="admin">
          {useSimplified ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Funcionalidade não disponível na TV</h2>
              <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            <Configuracoes onLogout={handleLogout} />
          )}
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const deviceInfo = useDeviceDetection();
  const queryConfig = getOptimizedQueryConfig(deviceInfo);
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: queryConfig,
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {!shouldUseSimplifiedComponents(deviceInfo) && <TooltipProvider />}
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          {!shouldUseSimplifiedComponents(deviceInfo) && (
            <>
              <Toaster />
              <Sonner />
            </>
          )}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
