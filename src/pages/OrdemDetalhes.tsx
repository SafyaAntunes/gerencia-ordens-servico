import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, Edit, Trash } from "lucide-react";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import EtapasTracker from "@/components/ordens/EtapasTracker";
import PausaRelatorio from "@/components/ordens/PausaRelatorio";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";
import { OrderDetailsTab } from "@/components/ordens/detalhes/OrderDetailsTab";
import { FotosTab } from "@/components/ordens/detalhes/FotosTab";
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

interface OrdemDetalhesProps extends LogoutProps {}

export default function OrdemDetalhes({ onLogout }: OrdemDetalhesProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { funcionario, canEditOrder } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchOrdem();
  }, [id]);

  const fetchOrdem = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, "ordens", id!);
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

  const handleStatusChange = async (newStatus: StatusOS) => {
    if (!id || !ordem) return;
    
    try {
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, { status: newStatus });
      
      setOrdem({
        ...ordem,
        status: newStatus
      });
      
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
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

  const handleOrdemUpdate = (ordemAtualizada: OrdemServico) => {
    setOrdem(ordemAtualizada);
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
          defaultValues={{
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
          }}
          defaultFotosEntrada={ordem?.fotosEntrada || []}
          defaultFotosSaida={ordem?.fotosSaida || []}
          onCancel={() => setIsEditando(false)}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger>
            <TabsTrigger value="tracker" className="flex-1">Tracker</TabsTrigger>
            <TabsTrigger value="progresso" className="flex-1">Progresso</TabsTrigger>
            <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
            <TabsTrigger value="relatorio" className="flex-1">Relatório de Pausas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detalhes">
            <OrderDetailsTab ordem={ordem} onStatusChange={handleStatusChange} />
          </TabsContent>
          
          <TabsContent value="tracker">
            <EtapasTracker ordem={ordem} onOrdemUpdate={handleOrdemUpdate} />
          </TabsContent>
          
          <TabsContent value="progresso">
            <ProgressoRelatorio ordem={ordem} />
          </TabsContent>
          
          <TabsContent value="fotos">
            <FotosTab ordem={ordem} />
          </TabsContent>
          
          <TabsContent value="relatorio">
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
}
