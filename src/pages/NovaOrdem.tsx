
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico, OrdemServico, SubAtividade, EtapaOS, TipoAtividade } from "@/types/ordens";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getClientes } from "@/services/clienteService";
import { getMotores } from "@/services/motorService";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { Cliente } from "@/types/clientes";
import { Motor } from "@/types/motor";
import { useStorage } from "@/hooks/useStorage";

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
  const [allMotores, setAllMotores] = useState<Motor[]>([]); // All motors from Motores list
  const [loading, setLoading] = useState(true);
  const { uploadFile } = useStorage();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesData, motoresData] = await Promise.all([
          getClientes(),
          getMotores()
        ]);
        
        setClientes(clientesData);
        setAllMotores(motoresData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar dados necessários");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle subatividade toggle - empty implementation to satisfy TypeScript
  const handleSubatividadeToggle = (servicoTipo: string, subatividadeId: string, checked: boolean) => {
    // This is just a placeholder since we don't need to implement any functionality here
    console.log(`Toggled subatividade ${subatividadeId} for ${servicoTipo}: ${checked}`);
  };
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Garantir que os arrays de fotos existam
      const fotosEntrada = Array.isArray(values.fotosEntrada) ? values.fotosEntrada : [];
      const fotosSaida = Array.isArray(values.fotosSaida) ? values.fotosSaida : [];
      
      const processImages = async (files: File[], folder: string): Promise<string[]> => {
        const imageUrls: string[] = [];
        
        for (const file of files) {
          if (file && file instanceof File) {
            try {
              const url = await uploadFile(file, folder);
              if (url) {
                imageUrls.push(url);
              } else {
                console.warn(`Não foi possível fazer upload da imagem: ${file.name}`);
              }
            } catch (uploadError) {
              console.error(`Erro ao fazer upload de ${file.name}:`, uploadError);
            }
          }
        }
        
        return imageUrls;
      };
      
      console.log("Processando imagens de entrada...");
      const fotosEntradaUrls = await processImages(fotosEntrada, `ordens/${values.id}/entrada`);
      console.log(`${fotosEntradaUrls.length} imagens de entrada processadas`);
      
      console.log("Processando imagens de saída...");
      const fotosSaidaUrls = await processImages(fotosSaida, `ordens/${values.id}/saida`);
      console.log(`${fotosSaidaUrls.length} imagens de saída processadas`);
      
      let clienteNome = "Cliente não encontrado";
      let clienteTelefone = "";
      let clienteEmail = "";
      let clienteMotores: Motor[] = [];
      
      if (values.clienteId) {
        try {
          const clienteDoc = await getDoc(doc(db, "clientes", values.clienteId));
          if (clienteDoc.exists()) {
            const clienteData = clienteDoc.data();
            clienteNome = clienteData.nome || "Cliente sem nome";
            clienteTelefone = clienteData.telefone || "";
            clienteEmail = clienteData.email || "";
            
            // Carregar os motores do cliente
            const motoresRef = collection(db, `clientes/${values.clienteId}/motores`);
            const motoresSnapshot = await getDocs(motoresRef);
            clienteMotores = motoresSnapshot.docs.map(motorDoc => ({
              id: motorDoc.id,
              ...motorDoc.data()
            })) as Motor[];
          }
        } catch (clientError) {
          console.error("Erro ao buscar dados do cliente:", clientError);
        }
      }
      
      // RECALCULAR TEMPO TOTAL ESTIMADO - VERSÃO CORRIGIDA
      let tempoTotalEstimadoHoras = 0;
      
      // 1. Calcular tempo estimado para as subatividades dos serviços
      if (values.servicosSubatividades) {
        Object.entries(values.servicosSubatividades).forEach(([tipo, subs]: [string, any]) => {
          (subs as SubAtividade[]).forEach(sub => {
            if (sub.selecionada && sub.tempoEstimado) {
              tempoTotalEstimadoHoras += sub.tempoEstimado;
            }
          });
        });
      }
      
      // 2. Array com os tipos de serviços selecionados
      const servicosSelecionados = values.servicosTipos || [];
      
      // Não precisamos mais disso, já que lavagem, inspeção inicial e final são agora serviços
      // e seus tempos estimados já estarão incluídos nas subatividades
      
      console.log("Tempo total estimado (horas):", tempoTotalEstimadoHoras);
      
      // Calcular tempo total em milissegundos
      const tempoTotalEstimadoMS = tempoTotalEstimadoHoras * 60 * 60 * 1000; // horas para ms
      
      const formattedServicoSubatividades: Record<string, SubAtividade[]> = {};
      
      if (values.servicosSubatividades) {
        Object.entries(values.servicosSubatividades).forEach(([tipo, subatividades]) => {
          formattedServicoSubatividades[tipo] = (subatividades as SubAtividade[]).map(sub => ({
            ...sub,
            nome: toTitleCase(sub.nome)
          }));
        });
      }
      
      // Preparar as atividades específicas para cada serviço
      const formattedAtividadesEspecificas: Record<string, Record<string, SubAtividade[]>> = {};
      
      if (values.atividadesEspecificas) {
        Object.entries(values.atividadesEspecificas).forEach(([servicoTipo, atividades]) => {
          formattedAtividadesEspecificas[servicoTipo] = {};
          
          Object.entries(atividades).forEach(([tipoAtividade, subatividades]) => {
            formattedAtividadesEspecificas[servicoTipo][tipoAtividade] = (subatividades as SubAtividade[]).map(sub => ({
              ...sub,
              nome: toTitleCase(sub.nome),
              servicoTipo: servicoTipo as TipoServico
            }));
          });
        });
      }
      
      const servicos = (values.servicosTipos || []).map((tipo: TipoServico) => {
        const servicoObj: any = {
          tipo,
          descricao: values.servicosDescricoes?.[tipo] || "",
          concluido: false,
          subatividades: formattedServicoSubatividades[tipo] || []
        };
        
        // Adicionar atividades específicas para este serviço, se existirem
        if (formattedAtividadesEspecificas[tipo]) {
          servicoObj.atividadesRelacionadas = formattedAtividadesEspecificas[tipo];
        }
        
        return servicoObj;
      });

      // Determinar as etapas necessárias - removidas lavagem, inspeção inicial e final
      let etapas: EtapaOS[] = [];
      
      if (servicos.some(s => ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
        etapas.push("retifica");
      }
      
      if (servicos.some(s => s.tipo === "montagem")) {
        etapas.push("montagem");
      }
      
      if (servicos.some(s => s.tipo === "dinamometro")) {
        etapas.push("dinamometro");
      }

      const etapasAndamento: Record<string, any> = {};
      
      // Configurar apenas as etapas de retífica, montagem e dinamômetro
      etapas.forEach(etapa => {
        etapasAndamento[etapa] = { 
          concluido: false,
          usarCronometro: true,
          pausas: [],
          tempoEstimado: 0 // Tempo estimado será baseado nas subatividades
        };
      });

      // Convert JavaScript Date objects to Firestore Timestamp objects
      const dataAbertura = values.dataAbertura instanceof Date 
        ? Timestamp.fromDate(values.dataAbertura)
        : Timestamp.now();
      
      const dataPrevistaEntrega = values.dataPrevistaEntrega instanceof Date 
        ? Timestamp.fromDate(values.dataPrevistaEntrega) 
        : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 1 week from now

      // Create a new order object with proper Timestamp fields
      const newOrder: any = {
        id: values.id,
        nome: values.nome,
        cliente: {
          id: values.clienteId,
          nome: clienteNome,
          telefone: clienteTelefone, 
          email: clienteEmail,
          motores: clienteMotores
        },
        motorId: values.motorId,
        dataAbertura,
        dataPrevistaEntrega,
        prioridade: values.prioridade as Prioridade,
        status: "orcamento",
        servicos: values.servicosTipos.map((tipo: TipoServico) => ({
          tipo,
          descricao: values.servicosDescricoes?.[tipo] || "",
          concluido: false,
          subatividades: values.servicosSubatividades?.[tipo] || []
        })),
        etapasAndamento,
        tempoRegistros: [],
        fotosEntrada: fotosEntradaUrls,
        fotosSaida: fotosSaidaUrls,
        progressoEtapas: 0,
        tempoTotalEstimado: tempoTotalEstimadoMS
      };
      
      console.log("Salvando ordem de serviço...", newOrder);
      
      try {
        await setDoc(doc(db, "ordens_servico", values.id), newOrder);
        toast.success("Ordem de serviço criada com sucesso!");
        navigate("/ordens");
      } catch (firestoreError) {
        console.error("Erro ao salvar no Firestore:", firestoreError);
        toast.error("Erro ao salvar os dados da ordem no banco.");
        throw firestoreError;
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar ordem de serviço. Verifique as permissões de armazenamento.");
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
        allMotores={allMotores}  // Pass all motors to the form
        isLoadingClientes={loading}
        initialData={{}}  // Use initialData instead of defaultValues
      />
    </Layout>
  );
}
