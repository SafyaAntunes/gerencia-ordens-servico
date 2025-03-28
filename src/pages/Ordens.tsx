
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import OrdemCard from "@/components/ordens/OrdemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { OrdemServico, StatusOS, Prioridade } from "@/types/ordens";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface OrdensProps {
  onLogout?: () => void;
}

export default function Ordens({ onLogout }: OrdensProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  useEffect(() => {
    // Carregar ordens do localStorage
    const carregarOrdens = () => {
      try {
        const ordensArmazenadas = localStorage.getItem('ordens');
        
        // Se não houver ordens armazenadas, criar dados iniciais de exemplo
        if (!ordensArmazenadas) {
          const ordensIniciais: OrdemServico[] = [
            {
              id: "1",
              nome: "Ordem 1",
              cliente: { 
                id: "1", 
                nome: "Cliente A",
                telefone: "123456789",
                email: "clientea@exemplo.com"
              },
              dataAbertura: new Date(),
              dataPrevistaEntrega: new Date(),
              prioridade: "alta",
              status: "orcamento",
              servicos: [{ tipo: "bloco", descricao: "Descrição do serviço", concluido: false }],
              etapasAndamento: {
                lavagem: { concluido: true },
                inspecao_inicial: { concluido: false },
                retifica: { concluido: true },
                montagem_final: { concluido: false },
                teste: { concluido: true },
                inspecao_final: { concluido: false },
              },
              tempoRegistros: []
            },
            {
              id: "2",
              nome: "Ordem 2",
              cliente: { 
                id: "2", 
                nome: "Cliente B",
                telefone: "987654321",
                email: "clienteb@exemplo.com"
              },
              dataAbertura: new Date(),
              dataPrevistaEntrega: new Date(),
              prioridade: "baixa",
              status: "finalizado",
              servicos: [{ tipo: "biela", descricao: "Descrição do serviço", concluido: true }],
              etapasAndamento: {
                lavagem: { concluido: true },
                inspecao_inicial: { concluido: true },
                retifica: { concluido: true },
                montagem_final: { concluido: true },
                teste: { concluido: true },
                inspecao_final: { concluido: true },
              },
              tempoRegistros: []
            },
            {
              id: "3",
              nome: "Ordem 3",
              cliente: { 
                id: "3", 
                nome: "Cliente C",
                telefone: "555555555",
                email: "clientec@exemplo.com"
              },
              dataAbertura: new Date(),
              dataPrevistaEntrega: new Date(),
              prioridade: "media",
              status: "fabricacao",
              servicos: [{ tipo: "cabecote", descricao: "Descrição do serviço", concluido: false }],
              etapasAndamento: {
                lavagem: { concluido: true },
                inspecao_inicial: { concluido: true },
                retifica: { concluido: false },
                montagem_final: { concluido: false },
                teste: { concluido: false },
                inspecao_final: { concluido: false },
              },
              tempoRegistros: []
            },
          ];
          
          // Salvar os dados iniciais
          localStorage.setItem('ordens', JSON.stringify(ordensIniciais));
          setOrdens(ordensIniciais);
        } else {
          // Converter datas para objetos Date
          const ordensParsed = JSON.parse(ordensArmazenadas);
          const ordensFormatadas = ordensParsed.map((ordem: any) => ({
            ...ordem,
            dataAbertura: new Date(ordem.dataAbertura),
            dataPrevistaEntrega: new Date(ordem.dataPrevistaEntrega),
          }));
          
          setOrdens(ordensFormatadas);
        }
      } catch (error) {
        console.error("Erro ao carregar ordens:", error);
      }
    };
    
    carregarOrdens();
  }, []);

  const filteredOrdens = ordens.filter((ordem) => {
    const searchMatch = ordem.nome.toLowerCase().includes(search.toLowerCase()) ||
                        ordem.cliente.nome.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" ? true : ordem.status === statusFilter;
    const prioridadeMatch = prioridadeFilter === "all" ? true : ordem.prioridade === prioridadeFilter;

    return searchMatch && statusMatch && prioridadeMatch;
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mb-6">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="orcamento">Orçamento</SelectItem>
              <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
              <SelectItem value="fabricacao">Fabricação</SelectItem>
              <SelectItem value="espera_cliente">Aguardando Cliente</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-[180px]">
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
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrdens.map((ordem) => (
          <OrdemCard 
            key={ordem.id} 
            ordem={ordem} 
            onClick={() => handleVerOrdem(ordem.id)}
          />
        ))}
      </div>
    </Layout>
  );
}
