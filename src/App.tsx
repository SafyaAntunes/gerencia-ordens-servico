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
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAuth } from "./hooks/useFirebase";
import { v4 as uuidv4 } from "uuid";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (formerly cacheTime)
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  minimumPermission?: 'admin' | 'gerente' | 'tecnico' | 'visualizacao';
}

const ProtectedRoute = ({ children, minimumPermission = 'visualizacao' }: ProtectedRouteProps) => {
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

const App = () => {
  const { logout } = useAuth();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard onLogout={logout} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/ordens" 
              element={
                <ProtectedRoute>
                  <Ordens onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/ordens/nova" 
              element={
                <ProtectedRoute minimumPermission="tecnico">
                  <NovaOrdem onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/ordens/:id" 
              element={
                <ProtectedRoute>
                  <OrdemDetalhes onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/funcionarios" 
              element={
                <ProtectedRoute>
                  <Funcionarios onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/clientes" 
              element={
                <ProtectedRoute>
                  <Clientes onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/clientes/cadastro" 
              element={
                <ProtectedRoute minimumPermission="tecnico">
                  <ClienteCadastro onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/clientes/editar/:id" 
              element={
                <ProtectedRoute minimumPermission="tecnico">
                  <ClienteCadastro onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/agenda" 
              element={
                <ProtectedRoute>
                  <Agenda onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/relatorios" 
              element={
                <ProtectedRoute minimumPermission="gerente">
                  <Relatorios onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/configuracoes" 
              element={
                <ProtectedRoute minimumPermission="admin">
                  <Configuracoes onLogout={logout} />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
