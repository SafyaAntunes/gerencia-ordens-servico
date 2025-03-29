import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";

interface OrdemDetalhesProps extends LogoutProps {}

const OrdemDetalhes = ({ onLogout }: OrdemDetalhesProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);

  useEffect(() => {
    if (!id) return;
    
    const fetchOrdem = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "ordens", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Format dates
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

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      if (!id) return;
      
      // Process and upload new images
      const processImages = async (files: File[], folder: string, existingUrls: string[] = []): Promise<string[]> => {
        const imageUrls: string[] = [...existingUrls];
        
        for (const file of files) {
          if (file && file instanceof File) {
            // Create a reference to the file in Firebase Storage
            const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
            
            // Upload the file
            await uploadBytes(fileRef, file);
            
            // Get download URL
            const url = await getDownloadURL(fileRef);
            imageUrls.push(url);
          }
        }
        
        return imageUrls;
      };
      
      // Update ordem object
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
      
      // Process new photos if any
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
      
      // Update in Firestore
      const orderRef = doc(db, "ordens", id);
      await updateDoc(orderRef, updatedOrder);
      
      toast.success("Ordem atualizada com sucesso!");
      navigate("/ordens");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare data for form
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
    <Layout>
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
        <h1 className="text-2xl font-bold">Editar Ordem {ordem.id}</h1>
      </div>
      
      <OrdemForm 
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        defaultValues={prepareFormData()}
        defaultFotosEntrada={ordem.fotosEntrada || []}
        defaultFotosSaida={ordem.fotosSaida || []}
      />
    </Layout>
  );
};

export default OrdemDetalhes;
