<<<<<<< HEAD

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Funcionarios from './pages/Funcionarios';
import Clientes from './pages/Clientes';
import Motores from './pages/Motores';
import ClienteCadastro from './pages/ClienteCadastro';
import NovaOrdem from './pages/NovaOrdem';
import Ordens from './pages/Ordens';
import OrdemDetalhes from './pages/OrdemDetalhes';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from './hooks/useAuth';
import Index from './pages/Index';
import Agenda from './pages/Agenda';
import RelatoriosProducao from './pages/RelatoriosProducao';
import Configuracoes from './pages/Configuracoes';
import ConfiguracoesAtividades from './pages/ConfiguracoesAtividades';
import SubatividadesConfig from './pages/SubatividadesConfig';
import SubatividadesReset from './pages/SubatividadesReset';
import { SidebarProvider } from '@/components/ui/sidebar';

function App() {
  const { user, loading, logout } = useAuth();
=======
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
import Motores from "./pages/Motores";
import MotorCadastro from "./pages/MotorCadastro";
import Agenda from "./pages/Agenda";
import RelatoriosProducao from "./pages/RelatoriosProducao";
import RelatoriosFinanceiro from "./pages/RelatoriosFinanceiro";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./hooks/useAuth";
>>>>>>> 9342a9b (teste)

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  return (
<<<<<<< HEAD
    <TooltipProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {user ? (
              <>
                <Route path="/dashboard" element={<Dashboard onLogout={logout} />} />
                <Route path="/funcionarios" element={<Funcionarios onLogout={logout} />} />
                <Route path="/clientes" element={<Clientes onLogout={logout} />} />
                <Route path="/motores" element={<Motores />} />
                <Route path="/clientes/novo" element={<ClienteCadastro onLogout={logout} />} />
                <Route path="/clientes/:id" element={<ClienteCadastro onLogout={logout} />} />
                <Route path="/ordens" element={<Ordens onLogout={logout} />} />
                <Route path="/ordens/nova" element={<NovaOrdem onLogout={logout} />} />
                <Route path="/ordens/:id" element={<OrdemDetalhes onLogout={logout} />} />
                <Route path="/agenda" element={<Agenda onLogout={logout} />} />
                <Route path="/relatorios/producao" element={<RelatoriosProducao onLogout={logout} />} />
                <Route path="/configuracoes" element={<Configuracoes onLogout={logout} />} />
                <Route path="/configuracoes/atividades" element={<ConfiguracoesAtividades onLogout={logout} />} />
                <Route path="/configuracoes/subatividades" element={<SubatividadesConfig onLogout={logout} />} />
                <Route path="/configuracoes/reset-subatividades" element={<SubatividadesReset onLogout={logout} />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
=======
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Dashboard - todos os níveis têm acesso */}
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/dashboard" element={
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
      
      {/* Redirecionar /subatividades para /configuracoes */}
      <Route path="/subatividades" element={
        <Navigate to="/configuracoes" replace />
      } />
      
      {/* Relatórios de Produção - gerentes ou superior */}
      <Route path="/relatorios/producao" element={
        <PrivateRoute requiredPermission="gerente">
          <RelatoriosProducao />
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
      
      {/* Motores - gerentes ou superior */}
      <Route path="/motores" element={
        <PrivateRoute requiredPermission="gerente">
          <Motores onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/motores/cadastro" element={
        <PrivateRoute requiredPermission="gerente">
          <MotorCadastro onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="/motores/editar/:id" element={
        <PrivateRoute requiredPermission="gerente">
          <MotorCadastro onLogout={handleLogout} />
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
>>>>>>> 9342a9b (teste)
  );
}

export default App;
