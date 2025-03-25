import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import OrdemCard from "@/components/ordens/OrdemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Calendar, Filter } from "lucide-react";
import { OrdemServico } from "@/types/ordens";
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
  const [statusFilter, setStatusFilter] = useState("");
  const [prioridadeFilter, setPrioridadeFilter] = useState("");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  useEffect(() => {
    // Função para buscar as ordens de serviço (substitua com sua lógica real)
    const fetchOrdens = async () => {
      // Simulação de dados (substitua pela chamada à API)
      const mockOrdens: OrdemServico[] = [
        {
          id: "1",
          nome: "Ordem 1",
          cliente: { id: "1", nome: "Cliente A" },
          dataAbertura: new Date(),
          dataPrevistaEntrega: new Date(),
          prioridade: "alta",
          status: "pendente",
          servicos: [{ tipo: "bloco" }],
          etapasAndamento: {
            etapa1: { concluido: true },
            etapa2: { concluido: false },
            etapa3: { concluido: true },
            etapa4: { concluido: false },
            etapa5: { concluido: true },
            etapa6: { concluido: false },
          },
        },
        {
          id: "2",
          nome: "Ordem 2",
          cliente: { id: "2", nome: "Cliente B" },
          dataAbertura: new Date(),
          dataPrevistaEntrega: new Date(),
          prioridade: "baixa",
          status: "concluida",
          servicos: [{ tipo: "biela" }],
          etapasAndamento: {
            etapa1: { concluido: true },
            etapa2: { concluido: true },
            etapa3: { concluido: true },
            etapa4: { concluido: true },
            etapa5: { concluido: true },
            etapa6: { concluido: true },
          },
        },
        {
          id: "3",
          nome: "Ordem 3",
          cliente: { id: "3", nome: "Cliente C" },
          dataAbertura: new Date(),
          dataPrevistaEntrega: new Date(),
          prioridade: "media",
          status: "em_andamento",
          servicos: [{ tipo: "cabecote" }],
          etapasAndamento: {
            etapa1: { concluido: true },
            etapa2: { concluido: true },
            etapa3: { concluido: false },
            etapa4: { concluido: false },
            etapa5: { concluido: false },
            etapa6: { concluido: false },
          },
        },
      ];
      setOrdens(mockOrdens);
    };

    fetchOrdens();
  }, []);

  const filteredOrdens = ordens.filter((ordem) => {
    const searchMatch = ordem.nome.toLowerCase().includes(search.toLowerCase()) ||
                        ordem.cliente.nome.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter ? ordem.status === statusFilter : true;
    const prioridadeMatch = prioridadeFilter ? ordem.prioridade === prioridadeFilter : true;

    return searchMatch && statusMatch && prioridadeMatch;
  });

  return (
    <Layout onLogout={onLogout}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Button onClick={() => navigate("/ordens/nova")}>
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
          <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
          <span>Filtrar por data:</span>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-muted-foreground mr-2" />
          <Select onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={prioridadeFilter ? () => setPrioridadeFilter("") : (value) => setPrioridadeFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrdens.map((ordem) => (
          <OrdemCard key={ordem.id} ordem={ordem} />
        ))}
      </div>
    </Layout>
  );
}
