
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
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Authentication guard component
const PrivateRoute = ({ children, requiredPermission = "visualizacao" }: { 
  children: React.ReactNode;
  requiredPermission?: string;
}) => {
  const { user, loading, hasPermission, canAccessRoute, funcionario } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Special case: If this is the funcionario's own profile page, allow access
  if (location.pathname.includes('/funcionarios/editar/') && 
      funcionario && 
      location.pathname.includes(funcionario.id)) {
    return <>{children}</>;
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
  const { logout, funcionario } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/ordens" element={
        <PrivateRoute requiredPermission="tecnico">
          <Ordens onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/ordens/nova" element={
        <PrivateRoute requiredPermission="gerente">
          <NovaOrdem onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/ordens/:id" element={
        <PrivateRoute requiredPermission="tecnico">
          <OrdemDetalhes onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/funcionarios" element={
        <PrivateRoute requiredPermission="gerente">
          <Funcionarios onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/funcionarios/editar/:id" element={
        <PrivateRoute requiredPermission="visualizacao">
          <Funcionarios onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
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
      
      <Route path="/agenda" element={
        <PrivateRoute requiredPermission="gerente">
          <Agenda onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/relatorios" element={
        <PrivateRoute requiredPermission="gerente">
          <Relatorios onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
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
