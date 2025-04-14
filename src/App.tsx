
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import ClienteCadastro from "@/pages/ClienteCadastro";
import Login from "@/pages/Login";
import Ordens from "@/pages/Ordens";
import NovaOrdem from "@/pages/NovaOrdem";
import Funcionarios from "@/pages/Funcionarios";
import OrdemDetalhes from "@/pages/OrdemDetalhes";
import Agenda from "@/pages/Agenda";
import Relatorios from "@/pages/Relatorios";
import RelatoriosFinanceiro from "@/pages/RelatoriosFinanceiro";
import RelatoriosProducao from "@/pages/RelatoriosProducao";
import Produtividade from "@/pages/Produtividade";
import Configuracoes from "@/pages/Configuracoes";
import SubatividadesConfig from "@/pages/SubatividadesConfig";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/cadastro" element={<ClienteCadastro />} />
              <Route path="/clientes/cadastro/:id" element={<ClienteCadastro />} />
              <Route path="/ordens" element={<Ordens />} />
              <Route path="/ordens/nova" element={<NovaOrdem />} />
              <Route path="/ordens/:id" element={<OrdemDetalhes />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/relatorios/financeiro" element={<RelatoriosFinanceiro />} />
              <Route path="/relatorios/producao" element={<RelatoriosProducao />} />
              <Route path="/produtividade" element={<Produtividade />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/configuracoes/subatividades" element={<SubatividadesConfig />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
