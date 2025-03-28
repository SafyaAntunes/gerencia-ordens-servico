
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico, OrdemServico } from "@/types/ordens";

export default function NovaOrdem() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Generate fake ID for demo purposes (this would come from the backend in a real app)
      const newId = `OS-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 100)}`;
      
      // Convert form values to order object
      const newOrder: OrdemServico = {
        id: newId,
        nome: values.nome,
        cliente: {
          id: values.clienteId,
          nome: "Cliente Teste", // In a real app, you'd get this from the client data
          telefone: "123456789", 
          email: "cliente@example.com"
        },
        dataAbertura: values.dataAbertura,
        dataPrevistaEntrega: values.dataPrevistaEntrega,
        prioridade: values.prioridade as Prioridade,
        status: "orcamento",
        servicos: (values.servicosTipos || []).map((tipo: TipoServico) => ({
          tipo,
          descricao: values.servicosDescricoes?.[tipo] || "",
          concluido: false
        })),
        etapasAndamento: {
          lavagem: { concluido: false },
          inspecao_inicial: { concluido: false },
          retifica: { concluido: false },
          montagem_final: { concluido: false },
          teste: { concluido: false },
          inspecao_final: { concluido: false },
        },
        tempoRegistros: []
      };
      
      // Salvar a nova ordem no localStorage
      const savedOrdens = localStorage.getItem('sgr-ordens');
      let ordens = [];
      
      if (savedOrdens) {
        ordens = JSON.parse(savedOrdens);
        ordens.push(newOrder);
      } else {
        ordens = [newOrder];
      }
      
      localStorage.setItem('sgr-ordens', JSON.stringify(ordens));
      
      toast.success("Ordem de serviço criada com sucesso!");
      
      // Navigate to the order view page
      navigate(`/ordens/${newId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Nova Ordem de Serviço</h1>
      
      <OrdemForm 
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </Layout>
  );
}
