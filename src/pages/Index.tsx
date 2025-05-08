
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FuncionariosDisponibilidade } from "@/components/funcionarios/FuncionariosDisponibilidade";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { OrdemServico } from "@/types/ordens";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MetricCard from "@/components/dashboard/MetricCard";

const Index = () => {
  const navigate = useNavigate();
  const [osAtrasadas, setOsAtrasadas] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOsAtrasadas = async () => {
      try {
        const ordensRef = collection(db, 'ordens_servico');
        const querySnapshot = await getDocs(ordensRef);
        
        const ordens: OrdemServico[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          ordens.push({
            ...data,
            id: doc.id,
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          } as OrdemServico);
        });
        
        const hoje = new Date();
        const atrasadas = ordens.filter(ordem => {
          return ordem.dataPrevistaEntrega < hoje && 
                 !['finalizado', 'entregue'].includes(ordem.status);
        });
        
        setOsAtrasadas(atrasadas.length);
      } catch (error) {
        console.error("Erro ao buscar ordens atrasadas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOsAtrasadas();
  }, []);

  const handleNavigateToAtrasadas = () => {
    navigate("/ordens?filter=atrasadas");
  };

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
        
        {/* Seção de status e monitoramento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FuncionariosDisponibilidade />
          
          {/* Card para OS's atrasadas usando o componente MetricCard */}
          {!loading && (
            <MetricCard
              title="OS's Atrasadas"
              value={osAtrasadas}
              description={osAtrasadas > 0 
                ? `Existem ${osAtrasadas} ${osAtrasadas === 1 ? 'ordem atrasada' : 'ordens atrasadas'} que necessitam de atenção imediata.` 
                : "Não há ordens atrasadas no momento."}
              icon={<AlertTriangle className="h-5 w-5" />}
              variant={osAtrasadas > 0 ? "danger" : "success"}
              onClick={handleNavigateToAtrasadas}
              className={osAtrasadas > 0 ? "cursor-pointer" : ""}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
