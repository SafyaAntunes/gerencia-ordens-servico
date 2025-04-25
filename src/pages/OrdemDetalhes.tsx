import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, Edit, ClipboardCheck, Trash, BarChart } from "lucide-react";
import { OrdemServico, StatusOS, TipoServico, SubAtividade, EtapaOS } from "@/types/ordens";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import EtapasTracker from "@/components/ordens/EtapasTracker";
import PausaRelatorio from "@/components/ordens/PausaRelatorio";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cliente, Motor } from "@/types/ordens";

interface OrdemDetalhesProps extends LogoutProps {}

const OrdemDetalhes = ({ onLogout }: OrdemDetalhesProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [motor, setMotor] = useState<Motor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string>("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { funcionario, canEditOrder } = useAuth();
  
  const statusLabels: Record<StatusOS, string> = {
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    fabricacao: "Fabricação",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue"
  };

  const etapasLabels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchOrdem = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "ordens", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const ordemFormatada: OrdemServico = {
            ...data,
            id: docSnap.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          } as OrdemServico;
          
          setOrdem(ordemFormatada);
          
          if (ordemFormatada.motorId && ordemFormatada.cliente?.id) {
            await fetchMotorDetails(ordemFormatada.cliente.id, ordemFormatada.motorId);
          }
        } else {
          toast.error("Ordem não encontrada");
          navigate("/ordens");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Erro ao carregar dados da ordem");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdem();
  }, [id, navigate]);

  const fetchMotorDetails = async (clienteId: string, motorId: string) => {
    try {
      const clientesRef = doc(db, "clientes", clienteId);
      const clienteDoc = await getDoc(clientesRef);
      
      if (clienteDoc.exists()) {
        const clienteData = clienteDoc.data() as Cliente;
        
        if (clienteData.motores && clienteData.motores.length > 0) {
          const motorEncontrado = clienteData.motores.find(m => m.id === motorId);
          if (motorEncontrado) {
            setMotor(motorEncontrado);
            console.log("Motor encontrado:", motorEncontrado);
          } else {
            console.log("Motor não encontrado na lista de motores do cliente");
          }
        } else {
          console.log("Cliente não possui motores cadastrados");
        }
      } else {
        console.log("Cliente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do motor:", error);
    }
  };

  const handleStatusChange = async (newStatus: StatusOS) => {
    if (!id || !ordem) return;
    
    try {
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, { status: newStatus });
      
      setOrdem({
        ...ordem,
        status: newStatus
      });
      
      toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!id || !ordem) return;
    
    try {
      const servicos = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, selecionada: checked };
            }
            return sub;
          });
          
          return { ...servico, subatividades };
        }
        return servico;
      });
      
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, { servicos });
      
      setOrdem({
        ...ordem,
        servicos
      });
    } catch (error) {
      console.error("Error updating subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };
  
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!id || !ordem) return;
    
    try {
      const servicos = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          return { ...servico, concluido };
        }
        return servico;
      });
      
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, { servicos });
      
      setOrdem({
        ...ordem,
        servicos
      });
      
      if (concluido) {
        toast.success(`Serviço ${servicoTipo} concluído`);
      }
    } catch (error) {
      console.error("Error updating servico status:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      if (!id) return;
      
      const processImages = async (files: File[], folder: string, existingUrls: string[] = []): Promise<string[]> => {
        const imageUrls: string[] = [...existingUrls];
        
        for (const file of files) {
          if (file && file instanceof File) {
            const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            imageUrls.push(url);
          }
        }
        
        return imageUrls;
      };
      
      const updatedOrder: Partial<OrdemServico> = {
        nome: values.nome,
        cliente: {
          ...ordem?.cliente,
          id: values.clienteId,
        },
        dataAbertura: values.dataAbertura,
        dataPrevistaEntrega: values.dataPrevistaEntrega,
        prioridade: values.prioridade,
        motorId: values.motorId,
        servicos: (values.servicosTipos || []).map((tipo: string) => ({
          tipo,
          descricao: values.servicosDescricoes?.[tipo] || "",
          concluido: false,
          subatividades: values.servicosSubatividades?.[tipo] || []
        }))
      };
      
      if (values.fotosEntrada && values.fotosEntrada.length > 0) {
        const existingEntradaUrls = ordem?.fotosEntrada?.filter(url => typeof url === 'string') || [];
        const newEntradaUrls = await processImages(
          values.fotosEntrada.filter((f: any) => f instanceof File), 
          `ordens/${id}/entrada`,
          existingEntradaUrls
        );
        updatedOrder.fotosEntrada = newEntradaUrls;
      }
      
      if (values.fotosSaida && values.fotosSaida.length > 0) {
        const existingSaidaUrls = ordem?.fotosSaida?.filter(url => typeof url === 'string') || [];
        const newSaidaUrls = await processImages(
          values.fotosSaida.filter((f: any) => f instanceof File), 
          `ordens/${id}/saida`,
          existingSaidaUrls
        );
        updatedOrder.fotosSaida = newSaidaUrls;
      }
      
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, updatedOrder);
      
      setOrdem(prev => {
        if (!prev) return null;
        return { ...prev, ...updatedOrder } as OrdemServico;
      });
      
      if (values.motorId && values.motorId !== ordem?.motorId) {
        await fetchMotorDetails(values.clienteId, values.motorId);
      }
      
      toast.success("Ordem atualizada com sucesso!");
      setIsEditando(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const prepareFormData = () => {
    if (!ordem) return {};
    
    return {
      id: ordem.id,
      nome: ordem.nome,
      clienteId: ordem.cliente?.id || "",
      motorId: ordem.motorId || "",
      dataAbertura: ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date(),
      dataPrevistaEntrega: ordem.dataPrevistaEntrega ? new Date(ordem.dataPrevistaEntrega) : new Date(),
      prioridade: ordem.prioridade || "media",
      servicosTipos: ordem.servicos?.map(s => s.tipo) || [],
      servicosDescricoes: ordem.servicos?.reduce((acc, s) => {
        acc[s.tipo] = s.descricao;
        return acc;
      }, {} as Record<string, string>) || {},
      servicosSubatividades: ordem.servicos?.reduce((acc, s) => {
        if (s.subatividades) {
          acc[s.tipo] = s.subatividades;
        }
        return acc;
      }, {} as Record<string, SubAtividade[]>) || {}
    };
  };

  const handleOrdemUpdate = (ordemAtualizada: OrdemServico) => {
    setOrdem(ordemAtualizada);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      const orderRef = doc(db, "ordens", id);
      await deleteDoc(orderRef);
      
      toast.success("Ordem de serviço excluída com sucesso!");
      navigate("/ordens");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Erro ao excluir ordem de serviço");
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const canEditThisOrder = ordem ? canEditOrder(ordem.id) : false;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }
  
  if (!ordem) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-lg mb-4">Ordem não encontrada</p>
          <Button onClick={() => navigate("/ordens")}>
            Voltar para listagem
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/ordens")}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para listagem
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            OS #{ordem.id.slice(-5)} - {ordem.nome}
          </h1>
          <div className="flex gap-2">
            {!isEditando && canEditThisOrder && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditando(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {isEditando ? (
        <OrdemForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          defaultValues={prepareFormData()}
          defaultFotosEntrada={ordem?.fotosEntrada || []}
          defaultFotosSaida={ordem?.fotosSaida || []}
          onCancel={() => setIsEditando(false)}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger>
            <TabsTrigger value="tracker" className="flex-1">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Tracker
            </TabsTrigger>
            <TabsTrigger value="progresso" className="flex-1">
              <BarChart className="h-4 w-4 mr-2" />
              Progresso
            </TabsTrigger>
            <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
            <TabsTrigger value="relatorio" className="flex-1">Relatório de Pausas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detalhes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status atual:</span>
                    <Badge variant="outline" className="text-base">
                      {statusLabels[ordem.status as StatusOS] || "Não definido"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Alterar status:</span>
                    <Select
                      value={ordem.status}
                      onValueChange={(value) => handleStatusChange(value as StatusOS)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orcamento">Orçamento</SelectItem>
                        <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                        <SelectItem value="fabricacao">Fabricação</SelectItem>
                        <SelectItem value="aguardando_peca_cliente">Aguardando Peça (Cliente)</SelectItem>
                        <SelectItem value="aguardando_peca_interno">Aguardando Peça (Interno)</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Abertura</p>
                      <p className="font-medium">
                        {format(new Date(ordem.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                      <p className="font-medium">
                        {format(new Date(ordem.dataPrevistaEntrega), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Prioridade</p>
                    <Badge className={
                      ordem.prioridade === 'baixa' ? 'bg-green-500' :
                      ordem.prioridade === 'media' ? 'bg-blue-500' :
                      ordem.prioridade === 'alta' ? 'bg-orange-500' :
                      ordem.prioridade === 'urgente' ? 'bg-red-500' : 'bg-gray-500'
                    }>
                      {ordem.prioridade === 'baixa' && 'Baixa'}
                      {ordem.prioridade === 'media' && 'Média'}
                      {ordem.prioridade === 'alta' && 'Alta'}
                      {ordem.prioridade === 'urgente' && 'Urgente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cliente e Motor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Dados do Cliente</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{ordem.cliente?.nome}</p>
                      </div>
                      {ordem.cliente?.telefone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{ordem.cliente?.telefone}</p>
                        </div>
                      )}
                      {ordem.cliente?.email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{ordem.cliente?.email}</p>
                        </div>
                      )}
                      {ordem.cliente?.cnpj_cpf && (
                        <div>
                          <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                          <p className="font-medium">{ordem.cliente?.cnpj_cpf}</p>
                        </div>
                      )}
                      {ordem.cliente?.endereco && (
                        <div>
                          <p className="text-sm text-muted-foreground">Endereço</p>
                          <p className="font-medium">{ordem.cliente?.endereco}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {motor && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Dados do Motor</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Marca</p>
                          <p className="font-medium">{motor.marca}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Modelo</p>
                          <p className="font-medium">{motor.modelo}</p>
                        </div>
                        {motor.ano && (
                          <div>
                            <p className="text-sm text-muted-foreground">Ano</p>
                            <p className="font-medium">{motor.ano}</p>
                          </div>
                        )}
                        {motor.numeroSerie && (
                          <div>
                            <p className="text-sm text-muted-foreground">Número de Série</p>
                            <p className="font-medium">{motor.numeroSerie}</p>
                          </div>
                        )}
                        {motor.cilindradas && (
                          <div>
                            <p className="text-sm text-muted-foreground">Cilindradas</p>
                            <p className="font-medium">{motor.cilindradas}</p>
                          </div>
                        )}
                        {motor.observacoes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Observações</p>
                            <p className="font-medium">{motor.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!motor && ordem?.motorId && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Dados do Motor</h3>
                      <p className="text-muted-foreground">ID do motor: {ordem.motorId}</p>
                      <p className="text-sm text-muted-foreground">
                        Detalhes completos não disponíveis.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tracker" className="space-y-4">
            <EtapasTracker
              ordem={ordem}
              onOrdemUpdate={handleOrdemUpdate}
            />
          </TabsContent>
          
          <TabsContent value="progresso" className="space-y-4">
            <ProgressoRelatorio ordem={ordem} />
          </TabsContent>
          
          <TabsContent value="fotos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fotos de Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordem.fotosEntrada && ordem.fotosEntrada.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {ordem.fotosEntrada.map((foto, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                          <img 
                            src={typeof foto === 'string' ? foto : foto.data} 
                            alt={`Foto de entrada ${index + 1}`} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma foto de entrada.</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fotos de Saída</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordem.fotosSaida && ordem.fotosSaida.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {ordem.fotosSaida.map((foto, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                          <img 
                            src={typeof foto === 'string' ? foto : foto.data} 
                            alt={`Foto de saída ${index + 1}`} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma foto de saída.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="relatorio" className="space-y-6">
            <PausaRelatorio ordem={ordem} />
          </TabsContent>
        </Tabs>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default OrdemDetalhes;
