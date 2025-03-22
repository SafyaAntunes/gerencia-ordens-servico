import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, Clock, Edit, Trash2, Save } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import OrdemCronometro from "@/components/ordens/OrdemCronometro";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

const ordemExemplo: OrdemServico = {
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
    { inicio: new Date(2023, 4, 16, 8, 0), fim: new Date(2023, 4, 16, 10, 30), duracao: 9000000, etapa: "lavagem", funcionarioId: "1" },
    { inicio: new Date(2023, 4, 17, 9, 0), fim: new Date(2023, 4, 18, 11, 0), duracao: 93600000, etapa: "inspecao_inicial", funcionarioId: "2" },
  ],
};

const funcionariosExemplo: Funcionario[] = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 98765-4321",
    especialidades: ["bloco", "virabrequim"],
    ativo: true,
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    email: "maria.oliveira@email.com",
    telefone: "(11) 91234-5678",
    especialidades: ["cabecote", "biela"],
    ativo: true,
  },
  {
    id: "3",
    nome: "Pedro Santos",
    email: "pedro.santos@email.com",
    telefone: "(11) 98888-7777",
    especialidades: ["eixo_comando", "virabrequim", "bloco"],
    ativo: true,
  },
];

export default function OrdemDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [ordem, setOrdem] = useState<OrdemServico>(ordemExemplo);
  const [status, setStatus] = useState<StatusOS>(ordem.status);
  const { toast } = useToast();
  
  const handleChangeStatus = (newStatus: StatusOS) => {
    setStatus(newStatus);
    
    toast({
      title: "Status atualizado",
      description: `O status da OS foi alterado para ${newStatus}`,
    });
  };
  
  const handleSaveTempoRegistro = (tempoRegistro: {
    inicio: Date;
    fim?: Date;
    duracao: number;
    etapa: string;
  }) => {
    toast({
      title: "Tempo registrado com sucesso",
      description: `Etapa: ${tempoRegistro.etapa}`,
      variant: "default",
    });
  };
  
  const handleDeleteOrdem = () => {
    toast({
      title: "OS excluída com sucesso",
      description: `A OS ${ordem.id} foi excluída permanentemente`,
      variant: "destructive",
    });
  };
  
  const getStatusColor = (status: StatusOS) => {
    switch (status) {
      case "orcamento":
        return "border-blue-200";
      case "aguardando_aprovacao":
        return "border-purple-200";
      case "fabricacao":
        return "border-amber-200";
      case "espera_cliente":
        return "border-gray-200";
      case "finalizado":
        return "border-emerald-200";
      case "entregue":
        return "border-teal-200";
      default:
        return "border-gray-200";
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link to="/ordens">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Ordem de Serviço <span className="text-primary">{id}</span>
              </h1>
              <p className="text-muted-foreground">
                {ordem.nome} - {ordem.cliente.nome}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/ordens/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar OS
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrdem}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir OS
            </Button>
          </div>
        </div>
        
        <Card className={`border-l-4 ${getStatusColor(status)}`}>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Informações da Ordem</CardTitle>
                <CardDescription>Visão geral da ordem de serviço</CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={status} onValueChange={(value) => handleChangeStatus(value as StatusOS)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status da OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orcamento">Em Orçamento</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                    <SelectItem value="fabricacao">Em Fabricação</SelectItem>
                    <SelectItem value="espera_cliente">Em Espera (Cliente)</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Informações da OS</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data de Abertura:</span>
                    <span className="text-sm font-medium">
                      {format(ordem.dataAbertura, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Previsão de Entrega:</span>
                    <span className="text-sm font-medium">
                      {format(ordem.dataPrevistaEntrega, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Prioridade:</span>
                    <StatusBadge status={ordem.prioridade} size="sm" />
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <span className="text-sm font-medium">{ordem.cliente.nome}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telefone:</span>
                    <span className="text-sm font-medium">{ordem.cliente.telefone}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium">{ordem.cliente.email}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Serviços</h3>
                <ul className="space-y-2">
                  {ordem.servicos.map((servico, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {servico.tipo.replace("_", " ")}:
                      </span>
                      <span className="text-sm font-medium">
                        {servico.concluido ? "Concluído" : "Pendente"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="progresso">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progresso" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Progresso
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Detalhes Técnicos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="progresso" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Tempo das Etapas</CardTitle>
                <CardDescription>
                  Registre o tempo gasto em cada etapa do processo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-4">Lavagem</h3>
                  <OrdemCronometro 
                    ordemId={ordem.id} 
                    funcionarioId={funcionariosExemplo[0].id} 
                    etapa="lavagem"
                    onSave={handleSaveTempoRegistro}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-4">Inspeção Inicial</h3>
                  <OrdemCronometro 
                    ordemId={ordem.id} 
                    funcionarioId={funcionariosExemplo[1].id} 
                    etapa="inspecao_inicial"
                    onSave={handleSaveTempoRegistro}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-4">Retífica</h3>
                  <OrdemCronometro 
                    ordemId={ordem.id} 
                    funcionarioId={funcionariosExemplo[2].id} 
                    etapa="retifica"
                    onSave={handleSaveTempoRegistro}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-4">Montagem Final</h3>
                  <OrdemCronometro 
                    ordemId={ordem.id} 
                    funcionarioId={funcionariosExemplo[0].id} 
                    etapa="montagem_final"
                    onSave={handleSaveTempoRegistro}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-4">Teste</h3>
                  <OrdemCronometro 
                    ordemId={ordem.id} 
                    funcionarioId={funcionariosExemplo[1].id} 
                    etapa="teste"
                    onSave={handleSaveTempoRegistro}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-4">Inspeção Final</h3>
                  <OrdemCronometro 
                    ordemId={ordem.id} 
                    funcionarioId={funcionariosExemplo[2].id} 
                    etapa="inspecao_final"
                    onSave={handleSaveTempoRegistro}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Tempos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="detalhes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes Técnicos</CardTitle>
                <CardDescription>
                  Informações detalhadas sobre os serviços realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordem.servicos.map((servico, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <h3 className="text-md font-medium mb-2 capitalize">
                        {servico.tipo.replace("_", " ")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {servico.descricao}
                      </p>
                    </div>
                  ))}
                  
                  <div className="pt-4">
                    <h3 className="text-md font-medium mb-2">Observações Técnicas</h3>
                    <p className="text-sm text-muted-foreground">
                      O motor apresentou desgaste acima do esperado nos mancais do virabrequim. 
                      Realizamos o processo de retífica seguindo as especificações do fabricante, 
                      com ajustes de tolerância conforme medições. Recomendamos revisão após 1.000km.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
