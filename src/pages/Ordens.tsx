import { useState } from "react";
import { PlusCircle, Filter, Search, FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Layout from "@/components/layout/Layout";
import OrdemCard from "@/components/ordens/OrdemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import OrdemForm from "@/components/ordens/OrdemForm";
import { OrdemServico, StatusOS, Cliente, Prioridade } from "@/types/ordens";

// Dados de exemplo
const ordens: OrdemServico[] = [
  {
    id: "OS-2023-001",
    nome: "Motor Ford Ka 2019",
    cliente: {
      id: "1",
      nome: "Auto Peças Silva",
      telefone: "(11) 98765-4321",
      email: "contato@autopecassilva.com.br",
    },
    dataAbertura: new Date(2023, 4, 15),
    dataPrevistaEntrega: new Date(2023, 4, 30),
    prioridade: "alta",
    servicos: [
      { tipo: "bloco", descricao: "Retífica completa do bloco", concluido: false },
      { tipo: "virabrequim", descricao: "Balanceamento", concluido: false },
    ],
    status: "fabricacao",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 4, 16), finalizado: new Date(2023, 4, 16) },
      inspecao_inicial: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 17), finalizado: new Date(2023, 4, 18) },
      retifica: { concluido: false, funcionarioId: "3", iniciado: new Date(2023, 4, 19) },
    },
    tempoRegistros: [
      {
        inicio: new Date(2023, 4, 16, 8, 0),
        fim: new Date(2023, 4, 16, 12, 0),
        funcionarioId: "1",
        etapa: "lavagem",
        pausas: [
          { inicio: new Date(2023, 4, 16, 10, 0), fim: new Date(2023, 4, 16, 10, 15) },
        ],
      },
      {
        inicio: new Date(2023, 4, 17, 13, 0),
        fim: new Date(2023, 4, 18, 17, 0),
        funcionarioId: "2",
        etapa: "inspecao_inicial",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 19, 8, 0),
        funcionarioId: "3",
        etapa: "retifica",
        pausas: [
          { inicio: new Date(2023, 4, 19, 12, 0), fim: new Date(2023, 4, 19, 13, 0) },
        ],
      },
    ],
  },
  {
    id: "OS-2023-002",
    nome: "Cabeçote Fiat Uno",
    cliente: {
      id: "2",
      nome: "Oficina Mecânica Central",
      telefone: "(11) 3333-4444",
      email: "oficina@central.com.br",
    },
    dataAbertura: new Date(2023, 4, 10),
    dataPrevistaEntrega: new Date(2023, 4, 25),
    prioridade: "media",
    servicos: [
      { tipo: "cabecote", descricao: "Retífica de válvulas", concluido: false },
    ],
    status: "aguardando_aprovacao",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 4, 11), finalizado: new Date(2023, 4, 11) },
      inspecao_inicial: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 12), finalizado: new Date(2023, 4, 12) },
    },
    tempoRegistros: [
      {
        inicio: new Date(2023, 4, 11, 9, 0),
        fim: new Date(2023, 4, 11, 11, 30),
        funcionarioId: "1",
        etapa: "lavagem",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 12, 14, 0),
        fim: new Date(2023, 4, 12, 16, 0),
        funcionarioId: "2",
        etapa: "inspecao_inicial",
        pausas: [],
      },
    ],
  },
  {
    id: "OS-2023-003",
    nome: "Virabrequim Caminhão Scania",
    cliente: {
      id: "3",
      nome: "Transportadora Rodovia",
      telefone: "(11) 5555-6666",
      email: "manutencao@rodovia.com.br",
    },
    dataAbertura: new Date(2023, 4, 5),
    dataPrevistaEntrega: new Date(2023, 4, 20),
    prioridade: "urgente",
    servicos: [
      { tipo: "virabrequim", descricao: "Recuperação e balanceamento", concluido: false },
    ],
    status: "orcamento",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 4, 6), finalizado: new Date(2023, 4, 6) },
    },
    tempoRegistros: [
      {
        inicio: new Date(2023, 4, 6, 10, 0),
        fim: new Date(2023, 4, 6, 12, 0),
        funcionarioId: "1",
        etapa: "lavagem",
        pausas: [],
      },
    ],
  },
  {
    id: "OS-2023-004",
    nome: "Bielas Honda Civic",
    cliente: {
      id: "4",
      nome: "Autoelétrica Express",
      telefone: "(11) 7777-8888",
      email: "atendimento@express.com.br",
    },
    dataAbertura: new Date(2023, 3, 25),
    dataPrevistaEntrega: new Date(2023, 4, 10),
    prioridade: "baixa",
    servicos: [
      { tipo: "biela", descricao: "Alinhamento e balanceamento", concluido: true },
    ],
    status: "entregue",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 3, 26), finalizado: new Date(2023, 3, 26) },
      inspecao_inicial: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 3, 27), finalizado: new Date(2023, 3, 27) },
      retifica: { concluido: true, funcionarioId: "3", iniciado: new Date(2023, 3, 28), finalizado: new Date(2023, 4, 2) },
      montagem_final: { concluido: true, funcionarioId: "4", iniciado: new Date(2023, 4, 3), finalizado: new Date(2023, 4, 4) },
      teste: { concluido: true, funcionarioId: "5", iniciado: new Date(2023, 4, 5), finalizado: new Date(2023, 4, 5) },
      inspecao_final: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 6), finalizado: new Date(2023, 4, 6) },
    },
    tempoRegistros: [
      {
        inicio: new Date(2023, 3, 26, 8, 0),
        fim: new Date(2023, 3, 26, 10, 0),
        funcionarioId: "1",
        etapa: "lavagem",
        pausas: [],
      },
      {
        inicio: new Date(2023, 3, 27, 13, 0),
        fim: new Date(2023, 3, 27, 15, 0),
        funcionarioId: "2",
        etapa: "inspecao_inicial",
        pausas: [],
      },
      {
        inicio: new Date(2023, 3, 28, 8, 0),
        fim: new Date(2023, 4, 2, 17, 0),
        funcionarioId: "3",
        etapa: "retifica",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 3, 8, 0),
        fim: new Date(2023, 4, 4, 17, 0),
        funcionarioId: "4",
        etapa: "montagem_final",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 5, 9, 0),
        fim: new Date(2023, 4, 5, 12, 0),
        funcionarioId: "5",
        etapa: "teste",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 6, 13, 0),
        fim: new Date(2023, 4, 6, 14, 0),
        funcionarioId: "2",
        etapa: "inspecao_final",
        pausas: [],
      },
    ],
  },
  {
    id: "OS-2023-005",
    nome: "Eixo de Comando Golf GTI",
    cliente: {
      id: "5",
      nome: "Concessionária Motors",
      telefone: "(11) 9999-0000",
      email: "pecas@motors.com.br",
    },
    dataAbertura: new Date(2023, 4, 2),
    dataPrevistaEntrega: new Date(2023, 4, 17),
    prioridade: "media",
    servicos: [
      { tipo: "eixo_comando", descricao: "Retífica e brunimento", concluido: true },
    ],
    status: "finalizado",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 4, 3), finalizado: new Date(2023, 4, 3) },
      inspecao_inicial: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 4), finalizado: new Date(2023, 4, 4) },
      retifica: { concluido: true, funcionarioId: "3", iniciado: new Date(2023, 4, 5), finalizado: new Date(2023, 4, 8) },
      montagem_final: { concluido: true, funcionarioId: "4", iniciado: new Date(2023, 4, 9), finalizado: new Date(2023, 4, 10) },
      teste: { concluido: true, funcionarioId: "5", iniciado: new Date(2023, 4, 11), finalizado: new Date(2023, 4, 11) },
      inspecao_final: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 12), finalizado: new Date(2023, 4, 12) },
    },
    tempoRegistros: [
      {
        inicio: new Date(2023, 4, 3, 9, 0),
        fim: new Date(2023, 4, 3, 11, 0),
        funcionarioId: "1",
        etapa: "lavagem",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 4, 14, 0),
        fim: new Date(2023, 4, 4, 16, 0),
        funcionarioId: "2",
        etapa: "inspecao_inicial",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 5, 8, 0),
        fim: new Date(2023, 4, 8, 17, 0),
        funcionarioId: "3",
        etapa: "retifica",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 9, 8, 0),
        fim: new Date(2023, 4, 10, 17, 0),
        funcionarioId: "4",
        etapa: "montagem_final",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 11, 9, 0),
        fim: new Date(2023, 4, 11, 12, 0),
        funcionarioId: "5",
        etapa: "teste",
        pausas: [],
      },
      {
        inicio: new Date(2023, 4, 12, 13, 0),
        fim: new Date(2023, 4, 12, 14, 0),
        funcionarioId: "2",
        etapa: "inspecao_final",
        pausas: [],
      },
    ],
  },
];

interface OrdensProps {
  onLogout: () => void;
}

const Ordens = ({ onLogout }: OrdensProps) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusOS | "todas">("todas");
  const [prioridadeFilter, setPrioridadeFilter] = useState<Prioridade | "todas">("todas");
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  
  const handleNavigateToDetalhe = (id: string) => {
    navigate(`/ordens/${id}`);
  };
  
  const handleCreateOrdem = (values: any) => {
    console.log("Nova ordem de serviço:", values);
    setIsDialogOpen(false);
    // Aqui você adicionaria a nova ordem ao estado ou enviaria para a API
  };
  
  // Filtrar ordens
  const filteredOrdens = ordens.filter((ordem) => {
    // Filtro de busca por nome ou cliente
    const matchesSearch = searchTerm === "" ||
      ordem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordem.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de status
    const matchesStatus = statusFilter === "todas" || ordem.status === statusFilter;
    
    // Filtro de prioridade
    const matchesPrioridade = prioridadeFilter === "todas" || ordem.prioridade === prioridadeFilter;
    
    return matchesSearch && matchesStatus && matchesPrioridade;
  });
  
  // Agrupar ordens por status para as tabs
  const ordensEmAndamento = filteredOrdens.filter(
    (ordem) => ["orcamento", "aguardando_aprovacao", "fabricacao", "espera_cliente"].includes(ordem.status)
  );
  
  const ordensConcluidas = filteredOrdens.filter(
    (ordem) => ["finalizado", "entregue"].includes(ordem.status)
  );
  
  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
            <p className="text-muted-foreground">
              Gerencie todas as ordens de serviço da sua retífica
            </p>
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Ordem de Serviço
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cliente..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusOS | "todas")}
            >
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os Status</SelectItem>
                <SelectItem value="orcamento">Em Orçamento</SelectItem>
                <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                <SelectItem value="fabricacao">Em Fabricação</SelectItem>
                <SelectItem value="espera_cliente">Em Espera</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={prioridadeFilter}
              onValueChange={(value) => setPrioridadeFilter(value as Prioridade | "todas")}
            >
              <SelectTrigger className="w-44">
                <AlertCircle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="todas" className="mt-4">
          <TabsList className="mb-6">
            <TabsTrigger value="todas" className="relative">
              Todas
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filteredOrdens.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="andamento" className="relative">
              Em Andamento
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {ordensEmAndamento.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="relative">
              Concluídas
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {ordensConcluidas.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todas">
            {filteredOrdens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma ordem encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhuma ordem de serviço com os filtros selecionados. Tente ajustar os filtros ou criar uma nova ordem.
                </p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Ordem de Serviço
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrdens.map((ordem) => (
                  <OrdemCard
                    key={ordem.id}
                    ordem={ordem}
                    onClick={() => handleNavigateToDetalhe(ordem.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="andamento">
            {ordensEmAndamento.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma ordem em andamento</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhuma ordem de serviço em andamento com os filtros selecionados.
                </p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Ordem de Serviço
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {ordensEmAndamento.map((ordem) => (
                  <OrdemCard
                    key={ordem.id}
                    ordem={ordem}
                    onClick={() => handleNavigateToDetalhe(ordem.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="concluidas">
            {ordensConcluidas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma ordem concluída</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhuma ordem de serviço concluída com os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {ordensConcluidas.map((ordem) => (
                  <OrdemCard
                    key={ordem.id}
                    ordem={ordem}
                    onClick={() => handleNavigateToDetalhe(ordem.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Nova Ordem de Serviço</DialogTitle>
              <DialogDescription>
                Preencha todos os campos para cadastrar uma nova ordem de serviço.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="p-6 pt-4 max-h-[80vh] overflow-y-auto">
              <OrdemForm 
                onSubmit={handleCreateOrdem} 
                defaultFotosEntrada={fotosEntrada}
                defaultFotosSaida={fotosSaida}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Ordens;
