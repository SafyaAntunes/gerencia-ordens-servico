
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

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  return (
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
                <Route path="/configuracoes/atividades" element={
                  <ConfiguracoesAtividades 
                    tipoAtividade="inspecao_inicial" 
                    titulo="Configuração de Atividades" 
                    descricao="Configure os tempos padrão para as atividades" 
                  />
                } />
                <Route path="/configuracoes/subatividades" element={<SubatividadesConfig />} />
                <Route path="/configuracoes/reset-subatividades" element={<SubatividadesReset />} />
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
  );
}

export default App;
