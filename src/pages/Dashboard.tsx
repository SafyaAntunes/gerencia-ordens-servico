
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import OrdemCard from "@/components/ordens/OrdemCard";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OrdemServico } from "@/types/ordens";

interface DashboardProps {
  onLogout?: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Carregar ordens do localStorage
    const loadOrdens = () => {
      setLoading(true);
      try {
        const savedOrdens = localStorage.getItem('sgr-ordens');
        
        if (savedOrdens) {
          // Parse JSON e converter datas de string para Date
          const parsedOrdens = JSON.parse(savedOrdens, (key, value) => {
            if (key === 'dataAbertura' || key === 'dataPrevistaEntrega') {
              return new Date(value);
            }
            return value;
          });
          
          setOrdens(parsedOrdens);
        }
      } catch (error) {
        console.error("Erro ao carregar ordens:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrdens();
  }, []);

  // Filtragem de ordens pelo texto de busca
  const filteredOrders = ordens.filter(ordem => 
    ordem.nome.toLowerCase().includes(search.toLowerCase()) ||
    ordem.cliente.nome.toLowerCase().includes(search.toLowerCase())
  );

  // Cálculos para os cards de métricas
  const totalOrdens = ordens.length;
  const ordensEmAndamento = ordens.filter(o => o.status === 'fabricacao').length;
  const ordensFinalizadas = ordens.filter(o => o.status === 'finalizado' || o.status === 'entregue').length;
  const ordensUrgentes = ordens.filter(o => o.prioridade === 'urgente' || o.prioridade === 'alta').length;

  // Dados para o gráfico de status
  const statusCounts = {
    orcamento: ordens.filter(o => o.status === 'orcamento').length,
    aguardando_aprovacao: ordens.filter(o => o.status === 'aguardando_aprovacao').length,
    fabricacao: ordens.filter(o => o.status === 'fabricacao').length,
    espera_cliente: ordens.filter(o => o.status === 'espera_cliente').length,
    finalizado: ordens.filter(o => o.status === 'finalizado').length,
    entregue: ordens.filter(o => o.status === 'entregue').length
  };

  // Lista de ordens recentes (últimas 5)
  const ordensRecentes = [...ordens]
    .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
    .slice(0, 5);

  // Lista de ordens próximas da entrega (próximos 7 dias)
  const hoje = new Date();
  const ordensPrioridade = [...ordens]
    .filter(ordem => ordem.status !== 'entregue' && ordem.status !== 'finalizado')
    .sort((a, b) => {
      const prioridadePeso = {
        'urgente': 4,
        'alta': 3,
        'media': 2,
        'baixa': 1
      };
      
      const pesoA = prioridadePeso[a.prioridade as keyof typeof prioridadePeso] || 0;
      const pesoB = prioridadePeso[b.prioridade as keyof typeof prioridadePeso] || 0;
      
      if (pesoB !== pesoA) {
        return pesoB - pesoA;
      }
      
      return new Date(a.dataPrevistaEntrega).getTime() - new Date(b.dataPrevistaEntrega).getTime();
    })
    .slice(0, 5);

  const handleVerOrdem = (id: string) => {
    navigate(`/ordens/${id}`);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Sistema de Gerenciamento de Retífica
          </p>
        </div>
        
        <div className="w-full md:w-72">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar ordem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Ordens"
          value={totalOrdens}
          description="Ordens cadastradas no sistema"
          icon="file"
        />
        <MetricCard
          title="Em andamento"
          value={ordensEmAndamento}
          description="Ordens em fabricação"
          trend="up"
          trendValue="12%"
          icon="wrench"
        />
        <MetricCard
          title="Finalizadas"
          value={ordensFinalizadas}
          description="Ordens entregues"
          trend="down"
          trendValue="5%"
          icon="check"
        />
        <MetricCard
          title="Urgente"
          value={ordensUrgentes}
          description="Prioridade alta/urgente"
          icon="alert"
        />
      </div>
      
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <StatusChart data={[
            { name: 'Orçamento', value: statusCounts.orcamento },
            { name: 'Aguardando', value: statusCounts.aguardando_aprovacao },
            { name: 'Fabricação', value: statusCounts.fabricacao },
            { name: 'Esp. Cliente', value: statusCounts.espera_cliente },
            { name: 'Finalizado', value: statusCounts.finalizado },
            { name: 'Entregue', value: statusCounts.entregue }
          ]} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Atividades Recentes</h2>
          <div className="space-y-2">
            {ordensRecentes.map(ordem => (
              <div 
                key={ordem.id} 
                className="p-3 border rounded-lg cursor-pointer hover:bg-secondary/50"
                onClick={() => handleVerOrdem(ordem.id)}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{ordem.nome}</h3>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ordem.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{ordem.cliente.nome}</p>
              </div>
            ))}
            
            {ordensRecentes.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma ordem recente
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ordens Prioritárias</h2>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {ordensPrioridade.map(ordem => (
            <OrdemCard
              key={ordem.id}
              ordem={ordem}
              onClick={() => handleVerOrdem(ordem.id)}
            />
          ))}
          
          {ordensPrioridade.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              Nenhuma ordem prioritária
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
