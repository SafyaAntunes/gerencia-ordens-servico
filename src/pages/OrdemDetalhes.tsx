import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, Edit, Clock, ClipboardCheck } from "lucide-react";
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
import EtapaCard from "@/components/ordens/EtapaCard";

interface OrdemDetalhesProps extends LogoutProps {}

const OrdemDetalhes = ({ onLogout }: OrdemDetalhesProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string>("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  const { funcionario } = useAuth();
  
  const statusLabels: Record<StatusOS, string> = {
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    fabricacao: "Fabricação",
    espera_cliente: "Aguardando Cliente",
    finalizado: "Finalizado",
    entregue: "Entregue"
  };

  const etapasLabels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem_final: "Montagem Final",
    teste: "Teste",
    inspecao_final: "Inspeção Final"
  };

  const etapasOrdenadas: EtapaOS[] = [
    'lavagem',
    'inspecao_inicial',
    'retifica',
    'montagem_final',
    'teste',
    'inspecao_final'
  ];

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

  const handleEtapaStart = async (etapa: EtapaOS) => {
    if (!id || !ordem || !funcionario) return;
    
    try {
      const etapasAndamento = { ...(ordem.etapasAndamento || {}) };
      
      etapasAndamento[etapa] = {
        concluido: false,
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        iniciado: new Date(),
      };
      
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, { 
        etapasAndamento,
        status: 'fabricacao' // Atualiza para fabricação se iniciar uma etapa
      });
      
      setOrdem({
        ...ordem,
        etapasAndamento,
        status: 'fabricacao'
      });
      
      toast.success(`Etapa ${etapasLabels[etapa]} iniciada`);
    } catch (error) {
      console.error("Error starting etapa:", error);
      toast.error("Erro ao iniciar etapa");
    }
  };

  const handleEtapaFinish = async (etapa: EtapaOS, tempoTotal: number) => {
    if (!id || !ordem) return;
    
    try {
      const etapasAndamento = { ...(ordem.etapasAndamento || {}) };
      
      etapasAndamento[etapa] = {
        ...etapasAndamento[etapa],
        concluido: true,
        finalizado: new Date(),
      };
      
      const todasConcluidas = etapasOrdenadas.every(e => 
        etapasAndamento[e]?.concluido === true
      );
      
      const novoStatus = todasConcluidas ? 'finalizado' : ordem.status;
      
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, { 
        etapasAndamento,
        status: novoStatus
      });
      
      setOrdem({
        ...ordem,
        etapasAndamento,
        status: novoStatus
      });
      
      toast.success(`Etapa ${etapasLabels[etapa]} finalizada`);
    } catch (error) {
      console.error("Error finishing etapa:", error);
      toast.error("Erro ao finalizar etapa");
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
          concluido: false
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
      }, {} as Record<string, string>) || {}
    };
  };

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
            {!isEditando && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditando(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
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
            <TabsTrigger value="progresso" className="flex-1">Progresso</TabsTrigger>
            <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
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
                      {statusLabels[ordem.status] || "Não definido"}
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
                        <SelectItem value="espera_cliente">Aguardando Cliente</SelectItem>
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
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
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
                  {ordem.motorId && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Motor</p>
                      <p className="font-medium">ID: {ordem.motorId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Serviços a Realizar</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordem.servicos?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ordem.servicos.map((servico, i) => (
                        <div key={i} className="border rounded-md p-4">
                          <p className="font-medium mb-1">
                            {servico.tipo === 'bloco' && 'Bloco'}
                            {servico.tipo === 'biela' && 'Biela'}
                            {servico.tipo === 'cabecote' && 'Cabeçote'}
                            {servico.tipo === 'virabrequim' && 'Virabrequim'}
                            {servico.tipo === 'eixo_comando' && 'Eixo de Comando'}
                          </p>
                          <p className="text-sm text-muted-foreground">{servico.descricao || "Sem descrição"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="progresso" className="space-y-4">
            <div className="flex flex-col gap-4">
              {etapasOrdenadas.map((etapa) => {
                const etapaInfo = ordem.etapasAndamento?.[etapa];
                const isConcluida = etapaInfo?.concluido === true;
                const isIniciada = !!etapaInfo?.iniciado;
                
                return (
                  <EtapaCard
                    key={etapa}
                    ordemId={ordem.id}
                    etapa={etapa}
                    etapaNome={etapasLabels[etapa]}
                    funcionarioId={etapaInfo?.funcionarioId || funcionario?.id || ""}
                    funcionarioNome={etapaInfo?.funcionarioNome || funcionario?.nome}
                    isConcluida={isConcluida}
                    isIniciada={isIniciada}
                    onStart={() => handleEtapaStart(etapa)}
                    onFinish={(tempoTotal) => handleEtapaFinish(etapa, tempoTotal)}
                  />
                );
              })}
            </div>
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
        </Tabs>
      )}
    </Layout>
  );
};

export default OrdemDetalhes;
