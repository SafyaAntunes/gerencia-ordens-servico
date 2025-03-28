import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Building, Calendar, Clock, Phone, Mail, Check, X, Edit, FileText, Trash2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, Servico, StatusOS, EtapaOS, TipoServico, Prioridade } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdemCronometro from "@/components/ordens/OrdemCronometro";
import { Progress } from "@/components/ui/progress";
import FotosForm from "@/components/ordens/FotosForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface OrdemDetalhesProps {
  onLogout?: () => void;
}

export default function OrdemDetalhes({ onLogout }: OrdemDetalhesProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusOS | null>(null);
  const { toast } = useToast();
  
  const funcionarioAtualId = "123"; // Simulando um ID de funcionário logado

  useEffect(() => {
    setTimeout(() => {
      const ordemEncontrada = {
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
        prioridade: "alta" as Prioridade,
        servicos: [
          { tipo: "bloco" as TipoServico, descricao: "Retífica completa do bloco", concluido: false },
          { tipo: "virabrequim" as TipoServico, descricao: "Balanceamento", concluido: false },
        ],
        status: "fabricacao" as StatusOS,
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
            etapa: "lavagem" as EtapaOS,
            pausas: [
              { inicio: new Date(2023, 4, 16, 10, 0), fim: new Date(2023, 4, 16, 10, 15) },
            ],
          },
          {
            inicio: new Date(2023, 4, 17, 13, 0),
            fim: new Date(2023, 4, 18, 17, 0),
            funcionarioId: "2",
            etapa: "inspecao_inicial" as EtapaOS,
            pausas: [],
          },
          {
            inicio: new Date(2023, 4, 19, 8, 0),
            funcionarioId: "3",
            etapa: "retifica" as EtapaOS,
            pausas: [
              { inicio: new Date(2023, 4, 19, 12, 0), fim: new Date(2023, 4, 19, 13, 0) },
            ],
          },
        ],
      } as OrdemServico;
      
      setOrdem(ordemEncontrada);
      setLoading(false);
    }, 1000);
  }, [id]);

  const calcularProgresso = () => {
    if (!ordem) return 0;
    const totalEtapas = 6; // Número total de etapas
    const etapasConcluidas = Object.values(ordem.etapasAndamento).filter(
      (etapa) => etapa?.concluido
    ).length;
    
    return Math.round((etapasConcluidas / totalEtapas) * 100);
  };

  const handleFotosEntradaChange = (fotos: File[]) => {
    setFotosEntrada(fotos);
    // Aqui você salvaria as fotos em uma API real
    toast({
      title: "Fotos atualizadas",
      description: "As fotos de entrada foram atualizadas com sucesso.",
    });
  };

  const handleFotosSaidaChange = (fotos: File[]) => {
    setFotosSaida(fotos);
    // Aqui você salvaria as fotos em uma API real
    toast({
      title: "Fotos atualizadas",
      description: "As fotos de saída foram atualizadas com sucesso.",
    });
  };
  
  const handleEditOrdem = () => {
    navigate(`/ordens/editar/${id}`);
  };
  
  const handleDeleteOrdem = () => {
    // Aqui você deletaria a ordem na API real
    setIsDeleteDialogOpen(false);
    navigate("/ordens");
    toast({
      title: "Ordem de serviço excluída",
      description: "A ordem de serviço foi excluída com sucesso.",
    });
  };
  
  const handleFinishTimer = (etapa: EtapaOS, tipoServico: TipoServico | undefined, tempoTotal: number) => {
    if (!ordem) return;
    
    // Criar cópia da ordem para modificar
    const ordemAtualizada = { ...ordem };
    
    // Atualizar etapa como concluída
    if (ordemAtualizada.etapasAndamento[etapa]) {
      ordemAtualizada.etapasAndamento[etapa] = {
        ...ordemAtualizada.etapasAndamento[etapa]!,
        concluido: true,
        finalizado: new Date()
      };
    } else {
      ordemAtualizada.etapasAndamento[etapa] = {
        concluido: true,
        funcionarioId: funcionarioAtualId,
        iniciado: new Date(),
        finalizado: new Date()
      };
    }
    
    // Se for a etapa de retífica, marcar o serviço específico como concluído se tipoServico for fornecido
    if (etapa === 'retifica' && tipoServico) {
      const servicosAtualizados = ordemAtualizada.servicos.map(servico => {
        if (servico.tipo === tipoServico) {
          return { ...servico, concluido: true };
        }
        return servico;
      });
      
      ordemAtualizada.servicos = servicosAtualizados;
    }
    
    // Atualizar registros de tempo
    const registroAtual = ordemAtualizada.tempoRegistros.find(
      registro => registro.etapa === etapa && !registro.fim
    );
    
    if (registroAtual) {
      registroAtual.fim = new Date();
    }
    
    // Atualizar a ordem
    setOrdem(ordemAtualizada);
    
    toast({
      title: "Tempo registrado e etapa finalizada",
      description: `Tempo total para ${etapa}${tipoServico ? ` (${tipoServico})` : ''}: ${formatarTempoTotal(tempoTotal)}`,
    });
    
    // Aqui você salvaria o registro de tempo na API real
  };
  
  const formatarTempoTotal = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };
  
  const getFuncionarioNome = (id: string) => {
    // Simulação - em um sistema real você buscaria o nome do funcionário
    const funcionarios: Record<string, string> = {
      "1": "João Silva",
      "2": "Maria Oliveira",
      "3": "Pedro Santos"
    };
    
    return funcionarios[id] || `Funcionário ID ${id}`;
  };
  
  const handleChangeStatus = () => {
    if (!ordem || !novoStatus) return;
    
    // Atualizar status da ordem
    const ordemAtualizada = { ...ordem, status: novoStatus };
    setOrdem(ordemAtualizada);
    setIsStatusDialogOpen(false);
    
    toast({
      title: "Status atualizado",
      description: `O status da ordem foi alterado para ${getStatusLabel(novoStatus)}.`,
    });
    
    // Aqui você atualizaria o status na API real
  };
  
  const getStatusLabel = (status: StatusOS) => {
    switch (status) {
      case "orcamento": return "Em Orçamento";
      case "aguardando_aprovacao": return "Aguardando Aprovação";
      case "fabricacao": return "Em Fabricação";
      case "espera_cliente": return "Em Espera (Cliente)";
      case "finalizado": return "Finalizado";
      case "entregue": return "Entregue";
      default: return "Desconhecido";
    }
  };

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-lg text-muted-foreground">Carregando detalhes da ordem...</p>
        </div>
      </Layout>
    );
  }

  if (!ordem) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex flex-col items-center justify-center p-12">
          <h2 className="text-2xl font-bold mb-2">Ordem não encontrada</h2>
          <p className="text-muted-foreground mb-4">A ordem de serviço solicitada não foi encontrada.</p>
          <Button onClick={() => navigate("/ordens")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a lista
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/ordens")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {ordem.nome}
                <StatusBadge status={ordem.prioridade} size="sm" />
              </h1>
              <p className="text-muted-foreground">
                OS: {ordem.id} • Cliente: {ordem.cliente.nome}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setNovoStatus(ordem.status);
                setIsStatusDialogOpen(true);
              }}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Alterar Status
            </Button>
            <Button variant="outline" onClick={handleEditOrdem}>
              <Edit className="mr-2 h-4 w-4" />
              Editar OS
            </Button>
            <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="progresso">Progresso</TabsTrigger>
            <TabsTrigger value="registros">Registros de Tempo</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes da OS</CardTitle>
                  <CardDescription>Informações gerais da ordem de serviço</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Data de Abertura</p>
                      <p className="text-sm text-muted-foreground">
                        {format(ordem.dataAbertura, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Data Prevista de Entrega</p>
                      <p className="text-sm text-muted-foreground">
                        {format(ordem.dataPrevistaEntrega, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <StatusBadge 
                      status={ordem.status as StatusOS} 
                      size="md" 
                      className="shrink-0" 
                    />
                    <div>
                      <p className="font-medium">Status Atual</p>
                      <p className="text-sm text-muted-foreground">
                        {ordem.status === "orcamento" && "Em Orçamento"}
                        {ordem.status === "aguardando_aprovacao" && "Aguardando Aprovação"}
                        {ordem.status === "fabricacao" && "Em Fabricação"}
                        {ordem.status === "espera_cliente" && "Em Espera (Cliente)"}
                        {ordem.status === "finalizado" && "Finalizado"}
                        {ordem.status === "entregue" && "Entregue"}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">Progresso</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concluído</span>
                        <span>{calcularProgresso()}%</span>
                      </div>
                      <Progress value={calcularProgresso()} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                  <CardDescription>Dados do cliente vinculado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Empresa</p>
                      <p className="text-sm text-muted-foreground">{ordem.cliente.nome}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{ordem.cliente.telefone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <p className="text-sm text-muted-foreground">{ordem.cliente.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Serviços Solicitados</CardTitle>
                <CardDescription>Detalhes dos serviços a serem realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordem.servicos.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum serviço cadastrado para esta OS.</p>
                  ) : (
                    ordem.servicos.map((servico: Servico, index: number) => (
                      <div key={index} className="rounded-md border border-border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {servico.tipo === 'bloco' && 'Bloco'}
                                {servico.tipo === 'biela' && 'Biela'}
                                {servico.tipo === 'cabecote' && 'Cabeçote'}
                                {servico.tipo === 'virabrequim' && 'Virabrequim'}
                                {servico.tipo === 'eixo_comando' && 'Eixo de Comando'}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                {servico.tipo}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{servico.descricao}</p>
                          </div>
                          <div className="flex items-center">
                            {servico.concluido ? (
                              <div className="flex items-center text-sm text-green-600">
                                <Check className="h-4 w-4 mr-1" />
                                <span>Concluído</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-yellow-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Em andamento</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="progresso">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Andamento das Etapas</CardTitle>
                <CardDescription>Acompanhe o progresso de cada etapa da ordem de serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-md border border-border p-4">
                    <h3 className="font-medium mb-3">Etapa: Lavagem</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {ordem.etapasAndamento.lavagem?.concluido ? (
                            <span className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Concluído
                            </span>
                          ) : (
                            <span className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              Em andamento
                            </span>
                          )}
                        </p>
                        {ordem.etapasAndamento.lavagem?.iniciado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Iniciado em: {format(ordem.etapasAndamento.lavagem.iniciado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.lavagem?.finalizado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Finalizado em: {format(ordem.etapasAndamento.lavagem.finalizado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.lavagem?.funcionarioId && (
                          <p className="text-xs font-medium mt-1">
                            Responsável: {getFuncionarioNome(ordem.etapasAndamento.lavagem.funcionarioId)}
                          </p>
                        )}
                      </div>
                      <OrdemCronometro 
                        ordemId={ordem.id} 
                        funcionarioId={funcionarioAtualId} 
                        etapa="lavagem"
                        onFinish={(tempo) => handleFinishTimer("lavagem", undefined, tempo)}
                        isEtapaConcluida={ordem.etapasAndamento.lavagem?.concluido}
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-border p-4">
                    <h3 className="font-medium mb-3">Etapa: Inspeção Inicial</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {ordem.etapasAndamento.inspecao_inicial?.concluido ? (
                            <span className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Concluído
                            </span>
                          ) : (
                            <span className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              Em andamento
                            </span>
                          )}
                        </p>
                        {ordem.etapasAndamento.inspecao_inicial?.iniciado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Iniciado em: {format(ordem.etapasAndamento.inspecao_inicial.iniciado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.inspecao_inicial?.finalizado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Finalizado em: {format(ordem.etapasAndamento.inspecao_inicial.finalizado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.inspecao_inicial?.funcionarioId && (
                          <p className="text-xs font-medium mt-1">
                            Responsável: {getFuncionarioNome(ordem.etapasAndamento.inspecao_inicial.funcionarioId)}
                          </p>
                        )}
                      </div>
                      <OrdemCronometro 
                        ordemId={ordem.id} 
                        funcionarioId={funcionarioAtualId} 
                        etapa="inspecao_inicial"
                        onFinish={(tempo) => handleFinishTimer("inspecao_inicial", undefined, tempo)}
                        isEtapaConcluida={ordem.etapasAndamento.inspecao_inicial?.concluido}
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-border p-4">
                    <h3 className="font-medium mb-3">Etapa: Retífica</h3>
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {ordem.etapasAndamento.retifica?.concluido ? (
                              <span className="flex items-center text-green-600">
                                <Check className="h-4 w-4 mr-1" />
                                Concluído
                              </span>
                            ) : (
                              <span className="flex items-center text-yellow-600">
                                <Clock className="h-4 w-4 mr-1" />
                                Em andamento
                              </span>
                            )}
                          </p>
                          {ordem.etapasAndamento.retifica?.iniciado && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Iniciado em: {format(ordem.etapasAndamento.retifica.iniciado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          {ordem.etapasAndamento.retifica?.finalizado && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Finalizado em: {format(ordem.etapasAndamento.retifica.finalizado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          {ordem.etapasAndamento.retifica?.funcionarioId && (
                            <p className="text-xs font-medium mt-1">
                              Responsável: {getFuncionarioNome(ordem.etapasAndamento.retifica.funcionarioId)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Cronômetros específicos para cada tipo de serviço na etapa de retífica */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {ordem.servicos.map((servico) => (
                          <OrdemCronometro 
                            key={servico.tipo}
                            ordemId={ordem.id} 
                            funcionarioId={funcionarioAtualId} 
                            etapa="retifica"
                            tipoServico={servico.tipo as TipoServico}
                            onFinish={(tempo) => handleFinishTimer("retifica", servico.tipo as TipoServico, tempo)}
                            isEtapaConcluida={servico.concluido}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-border p-4">
                    <h3 className="font-medium mb-3">Etapa: Montagem Final</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {ordem.etapasAndamento.montagem_final?.concluido ? (
                            <span className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Concluído
                            </span>
                          ) : (
                            <span className="flex items-center text-muted-foreground">
                              <X className="h-4 w-4 mr-1" />
                              Não iniciado
                            </span>
                          )}
                        </p>
                        {ordem.etapasAndamento.montagem_final?.iniciado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Iniciado em: {format(ordem.etapasAndamento.montagem_final.iniciado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.montagem_final?.funcionarioId && (
                          <p className="text-xs font-medium mt-1">
                            Responsável: {getFuncionarioNome(ordem.etapasAndamento.montagem_final.funcionarioId)}
                          </p>
                        )}
                      </div>
                      <OrdemCronometro 
                        ordemId={ordem.id} 
                        funcionarioId={funcionarioAtualId} 
                        etapa="montagem_final"
                        onFinish={(tempo) => handleFinishTimer("montagem_final", undefined, tempo)}
                        isEtapaConcluida={ordem.etapasAndamento.montagem_final?.concluido}
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-border p-4">
                    <h3 className="font-medium mb-3">Etapa: Teste</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {ordem.etapasAndamento.teste?.concluido ? (
                            <span className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Concluído
                            </span>
                          ) : (
                            <span className="flex items-center text-muted-foreground">
                              <X className="h-4 w-4 mr-1" />
                              Não iniciado
                            </span>
                          )}
                        </p>
                        {ordem.etapasAndamento.teste?.iniciado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Iniciado em: {format(ordem.etapasAndamento.teste.iniciado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.teste?.funcionarioId && (
                          <p className="text-xs font-medium mt-1">
                            Responsável: {getFuncionarioNome(ordem.etapasAndamento.teste.funcionarioId)}
                          </p>
                        )}
                      </div>
                      <OrdemCronometro 
                        ordemId={ordem.id} 
                        funcionarioId={funcionarioAtualId} 
                        etapa="teste"
                        onFinish={(tempo) => handleFinishTimer("teste", undefined, tempo)}
                        isEtapaConcluida={ordem.etapasAndamento.teste?.concluido}
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-border p-4">
                    <h3 className="font-medium mb-3">Etapa: Inspeção Final</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {ordem.etapasAndamento.inspecao_final?.concluido ? (
                            <span className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Concluído
                            </span>
                          ) : (
                            <span className="flex items-center text-muted-foreground">
                              <X className="h-4 w-4 mr-1" />
                              Não iniciado
                            </span>
                          )}
                        </p>
                        {ordem.etapasAndamento.inspecao_final?.iniciado && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Iniciado em: {format(ordem.etapasAndamento.inspecao_final.iniciado, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {ordem.etapasAndamento.inspecao_final?.funcionarioId && (
                          <p className="text-xs font-medium mt-1">
                            Responsável: {getFuncionarioNome(ordem.etapasAndamento.inspecao_final.funcionarioId)}
                          </p>
                        )}
                      </div>
                      <OrdemCronometro 
                        ordemId={ordem.id} 
                        funcionarioId={funcionarioAtualId} 
                        etapa="inspecao_final"
                        onFinish={(tempo) => handleFinishTimer("inspecao_final", undefined, tempo)}
                        isEtapaConcluida={ordem.etapasAndamento.inspecao_final?.concluido}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="registros">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registros de Tempo</CardTitle>
                <CardDescription>Histórico de tempo de trabalho na OS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordem.tempoRegistros.map((registro, index) => (
                    <div key={index} className="rounded-md border border-border p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-medium">
                            Etapa: {" "}
                            {registro.etapa === 'lavagem' && 'Lavagem'}
                            {registro.etapa === 'inspecao_inicial' && 'Inspeção Inicial'}
                            {registro.etapa === 'retifica' && 'Retífica'}
                            {registro.etapa === 'montagem_final' && 'Montagem Final'}
                            {registro.etapa === 'teste' && 'Teste'}
                            {registro.etapa === 'inspecao_final' && 'Inspeção Final'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Funcionário: {getFuncionarioNome(registro.funcionarioId)}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {registro.fim ? 'Finalizado' : 'Em andamento'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Início:</p>
                          <p className="text-sm">
                            {format(registro.inicio, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        
                        {registro.fim && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fim:</p>
                            <p className="text-sm">
                              {format(registro.fim, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {registro.pausas.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Pausas registradas:</p>
                          {registro.pausas.map((pausa, pausaIndex) => (
                            <div key={pausaIndex} className="text-sm flex gap-2 mt-1">
                              <span>
                                {format(pausa.inicio, "HH:mm", { locale: ptBR })}
                              </span>
                              <span>-</span>
                              <span>
                                {pausa.fim ? 
                                  format(pausa.fim, "HH:mm", { locale: ptBR }) : 
                                  'Em pausa'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fotos">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fotos da OS</CardTitle>
                <CardDescription>Registros fotográficos da entrada e saída</CardDescription>
              </CardHeader>
              <CardContent>
                <FotosForm 
                  fotosEntrada={fotosEntrada}
                  fotosSaida={fotosSaida}
                  onChangeFotosEntrada={handleFotosEntradaChange}
                  onChangeFotosSaida={handleFotosSaidaChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog de confirmação para excluir a OS */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrdem}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para alterar o status da OS */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da OS</DialogTitle>
            <DialogDescription>
              Selecione o novo status para esta ordem de serviço.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={novoStatus || undefined}
              onValueChange={(value) => setNovoStatus(value as StatusOS)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeStatus}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
