
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { useAuth } from "./hooks/useAuth";

// Authentication guard component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
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

const App = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/ordens" element={
              <PrivateRoute>
                <Ordens onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/ordens/nova" element={
              <PrivateRoute>
                <NovaOrdem onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/ordens/:id" element={
              <PrivateRoute>
                <OrdemDetalhes onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/funcionarios" element={
              <PrivateRoute>
                <Funcionarios onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/clientes" element={
              <PrivateRoute>
                <Clientes onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/clientes/cadastro" element={
              <PrivateRoute>
                <ClienteCadastro onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/clientes/editar/:id" element={
              <PrivateRoute>
                <ClienteCadastro onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/agenda" element={
              <PrivateRoute>
                <Agenda onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/relatorios" element={
              <PrivateRoute>
                <Relatorios onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="/configuracoes" element={
              <PrivateRoute>
                <Configuracoes onLogout={handleLogout} />
              </PrivateRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
