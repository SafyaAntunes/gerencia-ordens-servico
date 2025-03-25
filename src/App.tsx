
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Ordens from "./pages/Ordens";
import Funcionarios from "./pages/Funcionarios";
import NotFound from "./pages/NotFound";
import OrdemDetalhes from "./pages/OrdemDetalhes";
import Clientes from "./pages/Clientes";
import ClienteCadastro from "./pages/ClienteCadastro";
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Verificar autenticação ao iniciar
  useEffect(() => {
    const auth = localStorage.getItem("sgr-auth");
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);
  
  // Função para autenticação
  const handleLogin = (credentials: { email: string; password: string }) => {
    // Implementação simplificada de autenticação
    if (credentials.email && credentials.password) {
      localStorage.setItem("sgr-auth", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };
  
  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem("sgr-auth");
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota de login acessível sem autenticação */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login onLogin={handleLogin} />
              } 
            />
            
            {/* Rotas protegidas */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/ordens" 
              element={isAuthenticated ? <Ordens onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/ordens/:id" 
              element={isAuthenticated ? <OrdemDetalhes onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/funcionarios" 
              element={isAuthenticated ? <Funcionarios onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/clientes" 
              element={isAuthenticated ? <Clientes onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/clientes/cadastro" 
              element={isAuthenticated ? <ClienteCadastro /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/clientes/editar/:id" 
              element={isAuthenticated ? <ClienteCadastro /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/agenda" 
              element={isAuthenticated ? <Agenda /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/relatorios" 
              element={isAuthenticated ? <Relatorios /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/configuracoes" 
              element={isAuthenticated ? <Configuracoes /> : <Navigate to="/login" replace />} 
            />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
