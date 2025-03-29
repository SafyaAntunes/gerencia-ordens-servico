
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
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "./hooks/useFirebase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (formerly cacheTime)
    },
  },
});

// Create a ProtectedRoute component that needs to be inside the Router context
const ProtectedRouteContent = ({ children, minimumPermission = 'visualizacao' }: {
  children: React.ReactNode;
  minimumPermission?: 'admin' | 'gerente' | 'tecnico' | 'visualizacao';
}) => {
  const { user, loading, funcionario, hasPermission } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (minimumPermission && funcionario && !hasPermission(minimumPermission)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Create a wrapper for the logout functionality
const AppContent = () => {
  const { logout } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/" 
        element={
          <ProtectedRouteContent>
            <Dashboard onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        } 
      />
      
      <Route 
        path="/ordens" 
        element={
          <ProtectedRouteContent>
            <Ordens onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/ordens/nova" 
        element={
          <ProtectedRouteContent minimumPermission="tecnico">
            <NovaOrdem onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/ordens/:id" 
        element={
          <ProtectedRouteContent>
            <OrdemDetalhes onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/funcionarios" 
        element={
          <ProtectedRouteContent>
            <Funcionarios onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/clientes" 
        element={
          <ProtectedRouteContent>
            <Clientes onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/clientes/cadastro" 
        element={
          <ProtectedRouteContent minimumPermission="tecnico">
            <ClienteCadastro onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/clientes/editar/:id" 
        element={
          <ProtectedRouteContent minimumPermission="tecnico">
            <ClienteCadastro onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/agenda" 
        element={
          <ProtectedRouteContent>
            <Agenda onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/relatorios" 
        element={
          <ProtectedRouteContent minimumPermission="gerente">
            <Relatorios onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route 
        path="/configuracoes" 
        element={
          <ProtectedRouteContent minimumPermission="admin">
            <Configuracoes onLogout={() => logout(() => {})} />
          </ProtectedRouteContent>
        }
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
