
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Ordens from "./pages/Ordens";
import NovaOrdem from "./pages/NovaOrdem";
import Funcionarios from "./pages/Funcionarios";
import NotFound from "./pages/NotFound";
import OrdemDetalhes from "./pages/OrdemDetalhes";
import Clientes from "./pages/Clientes";
import ClienteCadastro from "./pages/ClienteCadastro";
import Agenda from "./pages/Agenda";
import RelatoriosProducao from "./pages/RelatoriosProducao";
import RelatoriosFinanceiro from "./pages/RelatoriosFinanceiro";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./hooks/useAuth";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (formerly cacheTime)
    },
  },
});

const AppRoutes = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Dashboard - todos os níveis têm acesso */}
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Ordens - todos os níveis têm acesso à listagem */}
      <Route path="/ordens" element={
        <PrivateRoute>
          <Ordens onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Criação de Ordens - apenas gerente ou superior */}
      <Route path="/ordens/nova" element={
        <PrivateRoute requiredPermission="gerente">
          <NovaOrdem onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Detalhes de Ordens - técnicos ou superior */}
      <Route path="/ordens/:id" element={
        <PrivateRoute requiredPermission="tecnico">
          <OrdemDetalhes onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Funcionários - gerentes ou superior */}
      <Route path="/funcionarios" element={
        <PrivateRoute requiredPermission="gerente">
          <Funcionarios onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Edição do próprio perfil - todos os níveis */}
      <Route path="/funcionarios/editar/:id" element={
        <PrivateRoute requiredPermission="tecnico">
          <Funcionarios onLogout={handleLogout} meuPerfil={true} />
        </PrivateRoute>
      } />
      
      {/* Clientes - gerentes ou superior */}
      <Route path="/clientes" element={
        <PrivateRoute requiredPermission="gerente">
          <Clientes onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/clientes/cadastro" element={
        <PrivateRoute requiredPermission="gerente">
          <ClienteCadastro onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/clientes/editar/:id" element={
        <PrivateRoute requiredPermission="gerente">
          <ClienteCadastro onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Agenda - gerentes ou superior */}
      <Route path="/agenda" element={
        <PrivateRoute requiredPermission="gerente">
          <Agenda onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Relatórios de Produção - gerentes ou superior */}
      <Route path="/relatorios/producao" element={
        <PrivateRoute requiredPermission="gerente">
          <RelatoriosProducao onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Relatórios Financeiros - apenas administradores */}
      <Route path="/relatorios/financeiro" element={
        <PrivateRoute requiredPermission="admin">
          <RelatoriosFinanceiro onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      {/* Redirecionar /relatorios para /relatorios/producao */}
      <Route path="/relatorios" element={
        <Navigate to="/relatorios/producao" replace />
      } />
      
      {/* Configurações - apenas administradores */}
      <Route path="/configuracoes" element={
        <PrivateRoute requiredPermission="admin">
          <Configuracoes onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
