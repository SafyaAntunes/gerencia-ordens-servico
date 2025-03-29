
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (formerly cacheTime)
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ordens" element={<Ordens />} />
            <Route path="/ordens/nova" element={<NovaOrdem />} />
            <Route path="/ordens/:id" element={<OrdemDetalhes />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/cadastro" element={<ClienteCadastro />} />
            <Route path="/clientes/editar/:id" element={<ClienteCadastro />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
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
