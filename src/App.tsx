
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteCadastro from './pages/ClienteCadastro';
import Ordens from './pages/Ordens';
import OrdemDetalhes from './pages/OrdemDetalhes';
import NovaOrdem from './pages/NovaOrdem';
import Login from './pages/Login';
import Configuracoes from './pages/Configuracoes';
import NotFound from './pages/NotFound';
import Funcionarios from './pages/Funcionarios';
import Agenda from './pages/Agenda';
import Relatorios from './pages/Relatorios';
import SubatividadesConfig from './pages/SubatividadesConfig';
import ServiceTypesConfig from './pages/ServiceTypesConfig';
import SubatividadesReset from './pages/SubatividadesReset';
import ConfiguracoesAtividades from './pages/ConfiguracoesAtividades';
import RelatoriosProducao from './pages/RelatoriosProducao';
import RelatoriosFinanceiro from './pages/RelatoriosFinanceiro';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<ClienteCadastro />} />
        <Route path="/clientes/:id" element={<ClienteCadastro />} />
        <Route path="/ordens" element={<Ordens />} />
        <Route path="/ordens/:id" element={<OrdemDetalhes />} />
        <Route path="/ordens/nova" element={<NovaOrdem />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/configuracoes/subatividades" element={<SubatividadesConfig />} />
        <Route path="/configuracoes/servicos" element={<ServiceTypesConfig />} />
        <Route path="/configuracoes/subatividades/reset" element={<SubatividadesReset />} />
        <Route path="/configuracoes/atividades" element={<ConfiguracoesAtividades tipoAtividade="lavagem" titulo="Configuração de Tempos de Atividade" descricao="Configure os tempos padrão para cada tipo de atividade" />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/relatorios/producao" element={<RelatoriosProducao onLogout={() => {}} />} />
        <Route path="/relatorios/financeiro" element={<RelatoriosFinanceiro />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
