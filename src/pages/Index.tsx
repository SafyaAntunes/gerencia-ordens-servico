
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Sistema de Gerenciamento de Ordens de Serviço</h1>
          <p className="text-lg text-gray-600 mb-6">
            Bem-vindo ao sistema de gerenciamento de ordens de serviço para sua oficina mecânica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3">Ordens de Serviço</h2>
            <p className="text-gray-600 mb-4">Crie, visualize e gerencie ordens de serviço</p>
            <Button onClick={() => navigate("/ordens")}>Acessar Ordens</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3">Clientes</h2>
            <p className="text-gray-600 mb-4">Gerencie informações de clientes</p>
            <Button onClick={() => navigate("/clientes")}>Acessar Clientes</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3">Configurações</h2>
            <p className="text-gray-600 mb-4">Configure parâmetros do sistema</p>
            <Button onClick={() => navigate("/configuracoes")}>Acessar Configurações</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
