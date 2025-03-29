
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
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (formerly cacheTime)
    },
  },
});

const App = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
            <Route path="/ordens" element={<Ordens onLogout={handleLogout} />} />
            <Route path="/ordens/nova" element={<NovaOrdem onLogout={handleLogout} />} />
            <Route path="/ordens/:id" element={<OrdemDetalhes onLogout={handleLogout} />} />
            <Route path="/funcionarios" element={<Funcionarios onLogout={handleLogout} />} />
            <Route path="/clientes" element={<Clientes onLogout={handleLogout} />} />
            <Route path="/clientes/cadastro" element={<ClienteCadastro onLogout={handleLogout} />} />
            <Route path="/clientes/editar/:id" element={<ClienteCadastro onLogout={handleLogout} />} />
            <Route path="/agenda" element={<Agenda onLogout={handleLogout} />} />
            <Route path="/relatorios" element={<Relatorios onLogout={handleLogout} />} />
            <Route path="/configuracoes" element={<Configuracoes onLogout={handleLogout} />} />
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
