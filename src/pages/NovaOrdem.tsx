import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico, OrdemServico, SubAtividade, EtapaOS, TipoAtividade } from "@/types/ordens";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { getClientes } from "@/services/clienteService";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { Cliente, Motor } from "@/types/clientes";

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
      
      // 1. Calcular tempo estimado para as subatividades dos serviços de retífica
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
      
      // 3. Obter configurações de tempo para cada etapa (lavagem, inspeção inicial, inspeção final)
      const etapasTipos: TipoAtividade[] = ['lavagem', 'inspecao_inicial', 'inspecao_final'];
      const temposEstimadosPorEtapa: Record<TipoAtividade, number> = {
        lavagem: 0,
        inspecao_inicial: 0,
        inspecao_final: 0
      };
      
      // Obter as configurações de tempo para cada etapa e serviço
      for (const etapaTipo of etapasTipos) {
        const configKey = `configuracao_${etapaTipo}`;
        const configSalva = localStorage.getItem(configKey);
        
        if (configSalva) {
          try {
            const config = JSON.parse(configSalva);
            
            // Para cada serviço selecionado, somar o tempo estimado da etapa
            for (const servicoTipo of servicosSelecionados) {
              const servicoConfig = config.find((item: any) => item.tipo === servicoTipo);
              
              if (servicoConfig) {
                // Converter "HH:MM" para horas
                const [horas, minutos] = servicoConfig.horaPadrao.split(":").map(Number);
                const tempoEmHoras = horas + (minutos / 60);
                
                // Somar ao tempo estimado para esta etapa
                temposEstimadosPorEtapa[etapaTipo] += tempoEmHoras;
                
                // Somar ao tempo total estimado
                tempoTotalEstimadoHoras += tempoEmHoras;
                
                console.log(`Adicionando ${tempoEmHoras}h para ${etapaTipo} de ${servicoTipo}`);
              }
            }
          } catch (error) {
            console.error(`Erro ao processar configuração de ${etapaTipo}:`, error);
          }
        }
      }
      
      console.log("Tempos estimados por etapa:", temposEstimadosPorEtapa);
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

      // Determinar as etapas necessárias
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
      
      // Configurar cada etapa com os tempos estimados
      etapas.forEach(etapa => {
        // Converter etapa para o tipo de atividade correspondente
        let tipoAtividade: TipoAtividade | undefined;
        if (etapa === 'lavagem') tipoAtividade = 'lavagem';
        else if (etapa === 'inspecao_inicial') tipoAtividade = 'inspecao_inicial';
        else if (etapa === 'inspecao_final') tipoAtividade = 'inspecao_final';
        
        // Obter tempo estimado da etapa (se for uma das etapas com configuração)
        const tempoEmHoras = tipoAtividade ? temposEstimadosPorEtapa[tipoAtividade] || 0 : 0;
        
        etapasAndamento[etapa] = { 
          concluido: false,
          usarCronometro: true,
          pausas: [],
          tempoEstimado: tempoEmHoras
        };
      });

      const newOrder: Partial<OrdemServico> = {
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
        tempoTotalEstimado: tempoTotalEstimadoMS
      };
      
      await setDoc(doc(db, "ordens_servico", values.id), newOrder);
      
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
      />
    </Layout>
  );
}
