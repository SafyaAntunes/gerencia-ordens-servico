
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
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User will be redirected due to the auth state change
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

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
                <Login />
              } 
            />
            
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/ordens" 
              element={isAuthenticated ? <Ordens onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/ordens/nova" 
              element={isAuthenticated ? <NovaOrdem onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
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
              element={isAuthenticated ? <ClienteCadastro onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/clientes/editar/:id" 
              element={isAuthenticated ? <ClienteCadastro onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/agenda" 
              element={isAuthenticated ? <Agenda onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
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
