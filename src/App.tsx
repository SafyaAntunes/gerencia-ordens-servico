
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Dashboard from "./pages/Dashboard";
import Ordens from "./pages/Ordens";
import OrdemDetalhes from "./pages/OrdemDetalhes";
import Funcionarios from "./pages/Funcionarios";
import Clientes from "./pages/Clientes";
import Agenda from "./pages/Agenda";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (credentials: { email: string; password: string }) => {
    // For demonstration purposes - use "admin@sgr.com" and "123456" for login
    console.log("Login attempt with:", credentials);
    if (credentials.email === "admin@sgr.com" && credentials.password === "123456") {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Routes>
            {!isLoggedIn ? (
              <>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
                <Route path="/ordens" element={<Ordens onLogout={handleLogout} />} />
                <Route path="/ordens/:id" element={<OrdemDetalhes onLogout={handleLogout} />} />
                <Route path="/funcionarios" element={<Funcionarios onLogout={handleLogout} />} />
                <Route path="/clientes" element={<Clientes onLogout={handleLogout} />} />
                <Route path="/agenda" element={<Agenda onLogout={handleLogout} />} />
                <Route path="/relatorios" element={<Relatorios onLogout={handleLogout} />} />
                <Route path="/configuracoes" element={<Configuracoes onLogout={handleLogout} />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
