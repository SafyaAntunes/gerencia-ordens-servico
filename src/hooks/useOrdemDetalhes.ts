
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { OrdemServico, StatusOS, SubAtividade } from "@/types/ordens";
import { toast } from "sonner";

export const useOrdemDetalhes = (id: string | undefined) => {
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchOrdem();
  }, [id]);

  const fetchOrdem = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, "ordens_servico", id!);
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

  const fetchMotorDetails = async (clienteId: string, motorId: string) => {
    try {
      if (!clienteId || !motorId) return;
      
      const motorRef = doc(db, `clientes/${clienteId}/motores`, motorId);
      const motorDoc = await getDoc(motorRef);
      
      if (motorDoc.exists()) {
        console.log("Motor details fetched successfully");
      }
    } catch (error) {
      console.error("Error fetching motor details:", error);
    }
  };

  const handleStatusChange = async (newStatus: StatusOS) => {
    if (!id || !ordem) return;
    
    try {
      const orderRef = doc(db, "ordens_servico", id);
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
      
      // Preserve existing subactivities
      const preserveExistingSubactivities = (currentServicos = [], newServicosTipos = []) => {
        const servicosMap = currentServicos.reduce((acc, servico) => {
          acc[servico.tipo] = servico;
          return acc;
        }, {});
        
        return newServicosTipos.map(tipo => {
          const existingServico = servicosMap[tipo];
          
          const novasSubatividades = values.servicosSubatividades?.[tipo] || [];
          
          if (existingServico && existingServico.subatividades) {
            const subatividadesPreservadas = novasSubatividades.map(novaSub => {
              const subExistente = existingServico.subatividades?.find(s => s.id === novaSub.id);
              if (subExistente) {
                return {
                  ...novaSub,
                  concluida: subExistente.concluida !== undefined ? subExistente.concluida : novaSub.concluida
                };
              }
              return novaSub;
            });
            
            return {
              tipo,
              descricao: values.servicosDescricoes?.[tipo] || "",
              concluido: existingServico.concluido || false,
              subatividades: subatividadesPreservadas,
              funcionarioId: existingServico.funcionarioId,
              funcionarioNome: existingServico.funcionarioNome,
              dataConclusao: existingServico.dataConclusao
            };
          }
          
          return {
            tipo,
            descricao: values.servicosDescricoes?.[tipo] || "",
            concluido: false,
            subatividades: novasSubatividades
          };
        });
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
        servicos: preserveExistingSubactivities(ordem?.servicos, values.servicosTipos)
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
      
      const orderRef = doc(db, "ordens_servico", id);
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
      const orderRef = doc(db, "ordens_servico", id);
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

  return {
    ordem,
    isLoading,
    isSubmitting,
    activeTab,
    isEditando,
    deleteDialogOpen,
    setActiveTab,
    setIsEditando,
    setDeleteDialogOpen,
    handleOrdemUpdate,
    handleSubmit,
    handleDelete,
    handleStatusChange,
  };
};
