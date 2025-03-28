
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { OrdemServico } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function OrdemDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);

  useEffect(() => {
    if (!id) return;
    
    // Recuperar ordens do localStorage
    const ordensArmazenadas = localStorage.getItem('ordens');
    
    if (ordensArmazenadas) {
      try {
        const ordens: OrdemServico[] = JSON.parse(ordensArmazenadas);
        const ordemEncontrada = ordens.find(o => o.id === id);
        
        if (ordemEncontrada) {
          setOrdem(ordemEncontrada);
          
          // Converter as imagens base64 para objetos File ou preparar para exibição
          if (ordemEncontrada.fotosEntrada && ordemEncontrada.fotosEntrada.length > 0) {
            // No caso do detalhe, apenas utilizamos diretamente as strings base64
            console.log("Fotos de entrada encontradas:", ordemEncontrada.fotosEntrada.length);
          }
          
          if (ordemEncontrada.fotosSaida && ordemEncontrada.fotosSaida.length > 0) {
            console.log("Fotos de saída encontradas:", ordemEncontrada.fotosSaida.length);
          }
        } else {
          toast.error("Ordem não encontrada");
          navigate("/ordens");
        }
      } catch (error) {
        console.error("Erro ao carregar ordem:", error);
        toast.error("Erro ao carregar dados da ordem");
      }
    }
    
    setIsLoading(false);
  }, [id, navigate]);

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Processar fotos e converter para base64
      const processarFotos = async () => {
        // Processar fotos só se houver arquivos novos do tipo File
        // A conversão para base64 já foi feita no estado atual
        
        // Recuperar ordens do localStorage
        const ordensArmazenadas = localStorage.getItem('ordens');
        let ordens: OrdemServico[] = [];
        
        if (ordensArmazenadas) {
          ordens = JSON.parse(ordensArmazenadas);
        }
        
        // Encontrar o índice da ordem atual
        const index = ordens.findIndex(o => o.id === id);
        
        if (index >= 0) {
          // Atualizar a ordem com os novos valores
          const updatedOrder: OrdemServico = {
            ...ordens[index],
            nome: values.nome,
            cliente: {
              ...ordens[index].cliente,
              id: values.clienteId,
            },
            dataAbertura: values.dataAbertura,
            dataPrevistaEntrega: values.dataPrevistaEntrega,
            prioridade: values.prioridade,
            servicos: (values.servicosTipos || []).map((tipo: string) => ({
              tipo,
              descricao: values.servicosDescricoes?.[tipo] || "",
              concluido: false
            })),
            motorId: values.motorId // Adiciona o motor selecionado
          };
          
          // Atualizar fotos apenas se houver novas
          if (values.fotosEntrada && values.fotosEntrada.length > 0) {
            // Converter novas fotos para base64
            const fotosEntradaBase64 = await converterFotosParaBase64(values.fotosEntrada);
            updatedOrder.fotosEntrada = fotosEntradaBase64;
          }
          
          if (values.fotosSaida && values.fotosSaida.length > 0) {
            // Converter novas fotos para base64
            const fotosSaidaBase64 = await converterFotosParaBase64(values.fotosSaida);
            updatedOrder.fotosSaida = fotosSaidaBase64;
          }
          
          // Atualizar a ordem no array
          ordens[index] = updatedOrder;
          
          // Salvar de volta no localStorage
          localStorage.setItem('ordens', JSON.stringify(ordens));
          
          toast.success("Ordem atualizada com sucesso!");
          
          // Navegar para a listagem de ordens
          navigate("/ordens");
        } else {
          toast.error("Ordem não encontrada para atualização");
        }
        
        setIsSubmitting(false);
      };
      
      const converterFotosParaBase64 = async (fotos: File[]) => {
        const fotosBase64 = [];
        
        for (const foto of fotos) {
          // Verificar se já é uma string (já convertido) ou um File
          if (typeof foto === 'string') {
            fotosBase64.push(foto);
          } else {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(foto);
            });
            
            fotosBase64.push({
              nome: foto.name,
              tipo: foto.type,
              tamanho: foto.size,
              data: base64
            });
          }
        }
        
        return fotosBase64;
      };
      
      processarFotos();
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de serviço");
      setIsSubmitting(false);
    }
  };

  // Preparar dados para form
  const prepareFormData = () => {
    if (!ordem) return {};
    
    return {
      id: ordem.id,
      nome: ordem.nome,
      clienteId: ordem.cliente?.id || "",
      motorId: ordem.motorId || "", // Adicionamos o motorId aqui
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
}
