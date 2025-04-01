
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico, OrdemServico, SubAtividade } from "@/types/ordens";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

interface NovaOrdemProps {
  onLogout?: () => void;
}

export default function NovaOrdem({ onLogout }: NovaOrdemProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Process images and upload to Firebase Storage
      const processImages = async (files: File[], folder: string): Promise<string[]> => {
        const imageUrls: string[] = [];
        
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
      
      // Upload images
      const fotosEntradaUrls = await processImages(values.fotosEntrada || [], `ordens/${values.id}/entrada`);
      const fotosSaidaUrls = await processImages(values.fotosSaida || [], `ordens/${values.id}/saida`);
      
      // Fetch client data to get the actual name
      let clienteNome = "Cliente não encontrado";
      let clienteTelefone = "";
      let clienteEmail = "";
      
      if (values.clienteId) {
        const clienteDoc = await getDoc(doc(db, "clientes", values.clienteId));
        if (clienteDoc.exists()) {
          const clienteData = clienteDoc.data();
          clienteNome = clienteData.nome || "Cliente sem nome";
          clienteTelefone = clienteData.telefone || "";
          clienteEmail = clienteData.email || "";
        }
      }
      
      // Create new order object
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
        servicos: (values.servicosTipos || []).map((tipo: TipoServico) => ({
          tipo,
          descricao: values.servicosDescricoes?.[tipo] || "",
          concluido: false,
          subatividades: values.servicosSubatividades?.[tipo] || []
        })),
        etapasAndamento: {
          lavagem: { concluido: false },
          inspecao_inicial: { concluido: false },
          retifica: { concluido: false },
          montagem_final: { concluido: false },
          teste: { concluido: false },
          inspecao_final: { concluido: false },
        },
        tempoRegistros: [],
        fotosEntrada: fotosEntradaUrls,
        fotosSaida: fotosSaidaUrls
      };
      
      // Save to Firestore with custom ID
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
      />
    </Layout>
  );
}
