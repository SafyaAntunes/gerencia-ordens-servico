
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Prioridade, TipoServico } from "@/types/ordens";

export default function NovaOrdem() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Here you would normally call an API to create the order
      console.log("Creating new order:", values);
      
      // Generate fake ID for demo purposes (this would come from the backend in a real app)
      const newId = Math.floor(Math.random() * 10000).toString();
      
      // Convert form values to order object
      const newOrder = {
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
