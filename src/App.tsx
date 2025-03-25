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
  
  useEffect(() => {
    const auth = localStorage.getItem("sgr-auth");
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLogin = (credentials: { email: string; password: string }) => {
    if (credentials.email && credentials.password) {
      localStorage.setItem("sgr-auth", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };
  
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
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login onLogin={handleLogin} />
              } 
            />
            
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/ordens" 
              element={isAuthenticated ? <Ordens /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/ordens/:id" 
              element={isAuthenticated ? <OrdemDetalhes /> : <Navigate to="/login" replace />} 
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
              element={isAuthenticated ? <Relatorios onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/configuracoes" 
              element={isAuthenticated ? <Configuracoes onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
