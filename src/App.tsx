
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Ordens from './pages/Ordens';
import OrdemDetalhes from './pages/OrdemDetalhes';
import Clientes from './pages/Clientes';
import ClienteCadastro from './pages/ClienteCadastro';
import Funcionarios from './pages/Funcionarios';
import Agenda from './pages/Agenda';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import NotFound from './pages/NotFound';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // em ambiente de produção seria false

  const handleLogin = (credentials: { email: string; password: string }): boolean => {
    // Simulação de login bem-sucedido
    console.log("Login com:", credentials.email, credentials.password);
    setIsLoggedIn(true);
    return true; // Indica login bem-sucedido
  };

  const handleLogout = () => {
    // Simulação de logout
    console.log("Realizando logout");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/ordens" element={<Ordens onLogout={handleLogout} />} />
        <Route path="/ordens/:id" element={<OrdemDetalhes />} />
        <Route path="/clientes" element={<Clientes onLogout={handleLogout} />} />
        <Route path="/clientes/cadastro" element={<ClienteCadastro onLogout={handleLogout} />} />
        <Route path="/funcionarios" element={<Funcionarios onLogout={handleLogout} />} />
        <Route path="/agenda" element={<Agenda onLogout={handleLogout} />} />
        <Route path="/relatorios" element={<Relatorios onLogout={handleLogout} />} />
        <Route path="/configuracoes" element={<Configuracoes onLogout={handleLogout} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
