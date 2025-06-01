import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico, OrdemServico, EtapaOS } from "@/types/ordens";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getClientes } from "@/services/clienteService";
import { getMotores } from "@/services/motorService";
import { Cliente } from "@/types/clientes";
import { Motor } from "@/types/motor";
import { useStorage } from "@/hooks/useStorage";

interface NovaOrdemProps {
  onLogout?: () => void;
}

export default function NovaOrdem({ onLogout }: NovaOrdemProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [allMotores, setAllMotores] = useState<Motor[]>([]);
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
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Validar se o ID foi preenchido
      if (!values.id || values.id.trim() === '') {
        toast.error("Por favor, preencha o código da OS");
        setIsSubmitting(false);
        return;
      }

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
      
      // Criar serviços simples com apenas tipo e descrição
      const servicos = (values.servicosTipos || []).map((tipo: TipoServico) => ({
        tipo,
        descricao: values.servicosDescricoes?.[tipo] || "",
        concluido: false,
        status: 'nao_iniciado'
      }));

      // Determinar as etapas necessárias baseadas nos serviços
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
      
      // Configurar etapas
      etapas.forEach(etapa => {
        etapasAndamento[etapa] = { 
          concluido: false,
          usarCronometro: true,
          pausas: [],
          tempoEstimado: 0
        };
      });

      // Convert JavaScript Date objects to Firestore Timestamp objects
      const dataAbertura = values.dataAbertura instanceof Date 
        ? Timestamp.fromDate(values.dataAbertura)
        : Timestamp.now();
      
      const dataPrevistaEntrega = values.dataPrevistaEntrega instanceof Date 
        ? Timestamp.fromDate(values.dataPrevistaEntrega) 
        : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      // Create a new order object
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
        servicos,
        etapasAndamento,
        tempoRegistros: [],
        fotosEntrada: [],
        fotosSaida: [],
        progressoEtapas: 0,
        tempoTotalEstimado: 0
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
      toast.error("Erro ao criar ordem de serviço.");
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
        allMotores={allMotores}
        isLoadingClientes={loading}
        initialData={{}}
      />
    </Layout>
  );
}
