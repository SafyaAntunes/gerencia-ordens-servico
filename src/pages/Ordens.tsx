
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import OrdemCard from "@/components/ordens/OrdemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter, BarChart } from "lucide-react";
import { OrdemServico, StatusOS, Prioridade } from "@/types/ordens";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OrdensProps {
  onLogout?: () => void;
}

export default function Ordens({ onLogout }: OrdensProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  const [progressoFilter, setProgressoFilter] = useState("all");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrdens = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "ordens"), orderBy("dataAbertura", "desc"));
        const querySnapshot = await getDocs(q);
        
        const ordensData: OrdemServico[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Calculando progresso para cada ordem se não existir
          let progressoEtapas = data.progressoEtapas;
          
          if (progressoEtapas === undefined) {
            // Determina etapas baseado nos serviços
            let etapas = ["lavagem", "inspecao_inicial"];
            
            if (data.servicos?.some((s: any) => 
              ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
              etapas.push("retifica");
            }
            
            if (data.servicos?.some((s: any) => s.tipo === "montagem")) {
              etapas.push("montagem");
            }
            
            if (data.servicos?.some((s: any) => s.tipo === "dinamometro")) {
              etapas.push("dinamometro");
            }
            
            etapas.push("inspecao_final");
            
            const etapasAndamento = data.etapasAndamento || {};
            const etapasConcluidas = etapas.filter(etapa => 
              etapasAndamento[etapa]?.concluido
            ).length;
            
            progressoEtapas = etapasConcluidas / etapas.length;
          }
          
          ordensData.push({
            ...data,
            id: doc.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
            progressoEtapas: progressoEtapas
          } as OrdemServico);
        });
        
        setOrdens(ordensData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Erro ao carregar ordens de serviço.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);

  const filteredOrdens = ordens.filter((ordem) => {
    if (!ordem) return false; // Skip invalid orders
    
    const searchMatch = 
      (ordem.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (ordem.cliente?.nome || '').toLowerCase().includes(search.toLowerCase());
    
    const statusMatch = statusFilter === "all" ? true : ordem.status === statusFilter;
    const prioridadeMatch = prioridadeFilter === "all" ? true : ordem.prioridade === prioridadeFilter;
    
    // Filtro de progresso
    let progressoMatch = true;
    const progresso = ordem.progressoEtapas !== undefined ? ordem.progressoEtapas * 100 : 0;
    
    switch (progressoFilter) {
      case "nao_iniciado":
        progressoMatch = progresso === 0;
        break;
      case "em_andamento":
        progressoMatch = progresso > 0 && progresso < 100;
        break;
      case "quase_concluido":
        progressoMatch = progresso >= 75 && progresso < 100;
        break;
      case "concluido":
        progressoMatch = progresso === 100;
        break;
      default:
        progressoMatch = true;
    }

    return searchMatch && statusMatch && prioridadeMatch && progressoMatch;
  });

  const handleNovaOrdem = () => {
    navigate("/ordens/nova");
  };

  const handleVerOrdem = (id: string) => {
    navigate(`/ordens/${id}`);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Button onClick={handleNovaOrdem}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Buscar ordem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="h-5 w-5 text-muted-foreground -ml-8" />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-muted-foreground mr-2" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="orcamento">Orçamento</SelectItem>
              <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
              <SelectItem value="retifica">Retífica</SelectItem>
              <SelectItem value="aguardando_peca_cliente">Aguardando Peça (Cliente)</SelectItem>
              <SelectItem value="aguardando_peca_interno">Aguardando Peça (Interno)</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2 col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-2 w-full">
            <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={progressoFilter} onValueChange={setProgressoFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por progresso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os progressos</SelectItem>
                <SelectItem value="nao_iniciado">Não iniciado (0%)</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="quase_concluido">Quase concluído (≥75%)</SelectItem>
                <SelectItem value="concluido">Concluído (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando ordens...</div>
      ) : filteredOrdens.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma ordem encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrdens.map((ordem) => (
            <OrdemCard 
              key={ordem.id} 
              ordem={ordem} 
              onClick={() => handleVerOrdem(ordem.id)}
            />
          ))}
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => navigate('/relatorios')} className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Ver relatórios de progresso
        </Button>
      </div>
    </Layout>
  );
}
