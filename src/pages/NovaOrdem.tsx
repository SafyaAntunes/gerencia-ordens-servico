
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
      // Gerar ID para a nova ordem
      const newId = Math.floor(Math.random() * 10000).toString();
      
      // Converter form values para objeto de ordem
      const newOrder: OrdemServico = {
        id: newId,
        nome: values.nome,
        cliente: {
          id: values.clienteId,
          nome: "Cliente Teste", // Em uma aplicação real, você buscaria esses dados do cliente
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
      
      // Recuperar ordens existentes do localStorage
      const ordensArmazenadas = localStorage.getItem('ordens');
      let ordens = [];
      
      if (ordensArmazenadas) {
        ordens = JSON.parse(ordensArmazenadas);
      }
      
      // Adicionar a nova ordem
      ordens.push(newOrder);
      
      // Salvar no localStorage
      localStorage.setItem('ordens', JSON.stringify(ordens));
      
      toast.success("Ordem de serviço criada com sucesso!");
      
      // Navegar para a página da ordem
      navigate(`/ordens/${newId}`);
    } catch (error) {
      console.error("Erro ao criar ordem:", error);
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
