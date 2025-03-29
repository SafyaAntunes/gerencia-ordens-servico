
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
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
import Login from "./pages/Login";
import { useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (formerly cacheTime)
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ 
  children, 
  requiredPermission 
}: { 
  children: JSX.Element, 
  requiredPermission?: string 
}) => {
  const { user, funcionario, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/ordens" replace />;
  }

  return children;
};

// Setup admin account component
const SetupAdmin = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const createAdminAccount = async () => {
      const adminEmail = 'admin@omerel.com';
      const adminPassword = 'admin123';
      
      try {
        // Check if admin account already exists
        const adminDocRef = doc(db, 'admin_setup', 'status');
        const adminDoc = await getDoc(adminDocRef);
        
        if (adminDoc.exists() && adminDoc.data().initialized) {
          console.log('Admin already initialized');
          return;
        }
        
        // Try to create the admin account
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          const adminUser = userCredential.user;
          
          // Update profile
          await updateProfile(adminUser, {
            displayName: 'Admin'
          });
          
          // Create admin funcionario document
          await setDoc(doc(db, 'funcionarios', adminUser.uid), {
            id: adminUser.uid,
            nome: 'Admin',
            email: adminEmail,
            telefone: '',
            especialidades: ['bloco', 'cabecote', 'biela', 'virabrequim'],
            ativo: true,
            nivelPermissao: 'admin'
          });
          
          // Mark admin as initialized
          await setDoc(adminDocRef, {
            initialized: true,
            timestamp: new Date()
          });
          
          console.log('Admin account created successfully');
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            // Email already exists, just mark setup as done
            await setDoc(adminDocRef, {
              initialized: true,
              timestamp: new Date()
            });
            console.log('Admin account already exists');
          } else {
            console.error('Error creating admin account:', error);
          }
        }
      } catch (error) {
        console.error('Error checking admin setup:', error);
      }
    };
    
    if (!user) {
      createAdminAccount();
    }
  }, [user]);
  
  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <SetupAdmin />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute requiredPermission="gerente">
                  <Dashboard onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/ordens" element={
                <ProtectedRoute>
                  <Ordens onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/ordens/nova" element={
                <ProtectedRoute>
                  <NovaOrdem onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/ordens/:id" element={
                <ProtectedRoute>
                  <OrdemDetalhes onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/funcionarios" element={
                <ProtectedRoute requiredPermission="gerente">
                  <Funcionarios onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/clientes" element={
                <ProtectedRoute requiredPermission="gerente">
                  <Clientes onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/clientes/cadastro" element={
                <ProtectedRoute requiredPermission="gerente">
                  <ClienteCadastro onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/clientes/editar/:id" element={
                <ProtectedRoute requiredPermission="gerente">
                  <ClienteCadastro onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/agenda" element={
                <ProtectedRoute requiredPermission="gerente">
                  <Agenda onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/relatorios" element={
                <ProtectedRoute requiredPermission="gerente">
                  <Relatorios onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="/configuracoes" element={
                <ProtectedRoute requiredPermission="admin">
                  <Configuracoes onLogout={() => {}} />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
