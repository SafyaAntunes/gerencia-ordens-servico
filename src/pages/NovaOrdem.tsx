
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico, OrdemServico, EtapaOS } from "@/types/ordens";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { getClientes } from "@/services/clienteService";
import { Cliente } from "@/types/clientes";
import { getSubatividades } from "@/services/subatividadeService";

const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface NovaOrdemProps {
  onLogout?: () => void;
}

export default function NovaOrdem({ onLogout }: NovaOrdemProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<TipoServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clientesData = await getClientes();
        setClientes(clientesData);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        toast.error("Erro ao carregar lista de clientes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientes();
  }, []);
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      const processImages = async (files: File[], folder: string): Promise<string[]> => {
        const imageUrls: string[] = [];
        
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
      
      const fotosEntradaUrls = await processImages(values.fotosEntrada || [], `ordens/${values.id}/entrada`);
      const fotosSaidaUrls = await processImages(values.fotosSaida || [], `ordens/${values.id}/saida`);
      
      let clienteNome = "Cliente não encontrado";
      let clienteTelefone = "";
      let clienteEmail = "";
      
      if (values.clienteId) {
        try {
          const clienteDoc = await getDoc(doc(db, "clientes", values.clienteId));
          if (clienteDoc.exists()) {
            const clienteData = clienteDoc.data();
            clienteNome = clienteData.nome || "Cliente sem nome";
            clienteTelefone = clienteData.telefone || "";
            clienteEmail = clienteData.email || "";
          }
        } catch (clientError) {
          console.error("Erro ao buscar dados do cliente:", clientError);
        }
      }
      
      // Carregar subatividades para incluir nos serviços
      let todasSubatividades = {};
      try {
        todasSubatividades = await getSubatividades();
      } catch (error) {
        console.error("Erro ao carregar subatividades:", error);
      }
      
      // Inicializar serviços com subatividades
      const servicos = (values.servicosTipos || []).map((tipo: TipoServico) => {
        const tipoSubatividades = (todasSubatividades as any)[tipo] || [];
        
        // Mapear apenas as subatividades selecionadas
        const subatividadesSelecionadas = values.subatividades && values.subatividades[tipo] 
          ? tipoSubatividades.map((sub: any) => ({
              ...sub,
              selecionada: values.subatividades[tipo].includes(sub.id),
              concluida: false
            }))
          : tipoSubatividades.map((sub: any) => ({
              ...sub,
              selecionada: false,
              concluida: false
            }));
        
        return {
          tipo,
          descricao: values.servicosDescricoes?.[tipo] || "",
          concluido: false,
          subatividades: subatividadesSelecionadas,
          inspecao: {
            inicial: false,
            final: false
          }
        };
      });

      let etapas: EtapaOS[] = ["lavagem", "inspecao_inicial"];
      
      if (servicos.some(s => ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
        etapas.push("retifica");
      }
      
      if (servicos.some(s => s.tipo === "montagem")) {
        etapas.push("montagem");
      }
      
      if (servicos.some(s => s.tipo === "dinamometro")) {
        etapas.push("dinamometro");
      }
      
      etapas.push("inspecao_final");

      const etapasAndamento: Record<string, any> = {};
      
      etapas.forEach(etapa => {
        etapasAndamento[etapa] = { 
          concluido: false,
          usarCronometro: true,
          pausas: []
        };
      });

      const newOrder: Partial<OrdemServico> = {
        id: values.id,
        nome: values.nome,
        cliente: {
          id: values.clienteId,
          nome: clienteNome,
          telefone: clienteTelefone, 
          email: clienteEmail
        },
        motorId: values.motorId,
        dataAbertura: values.dataAbertura,
        dataPrevistaEntrega: values.dataPrevistaEntrega,
        prioridade: values.prioridade as Prioridade,
        status: "orcamento",
        servicos,
        etapasAndamento,
        tempoRegistros: [],
        fotosEntrada: fotosEntradaUrls,
        fotosSaida: fotosSaidaUrls,
        progressoEtapas: 0,
        custoEstimadoMaoDeObra: 0
      };
      
      await setDoc(doc(db, "ordens", values.id), newOrder);
      
      toast.success("Ordem de serviço criada com sucesso!");
      navigate("/ordens");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout onLogout={onLogout}>
      <h1 className="text-2xl font-bold mb-6">Nova Ordem de Serviço</h1>
      
      <OrdemForm 
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        onCancel={() => navigate("/ordens")}
        clientes={clientes}
        isLoadingClientes={loading}
        hideSubatividades={false} // Mostrar seleção de subatividades na criação
      />
    </Layout>
  );
}
