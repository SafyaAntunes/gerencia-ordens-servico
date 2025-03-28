
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
      // Usar o ID fornecido pelo usuário
      const newId = values.id;
      
      // Converte o FormData do File para Base64
      const converterFotosParaBase64 = async (fotos: File[]) => {
        const fotosBase64 = [];
        
        for (const foto of fotos) {
          // Verificar se já é uma string base64 ou um objeto File
          if (typeof foto === 'string' || (foto && typeof foto === 'object' && 'data' in foto)) {
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
      
      // Converte as fotos para base64
      const processarFotos = async () => {
        const fotosEntradaBase64 = await converterFotosParaBase64(values.fotosEntrada || []);
        const fotosSaidaBase64 = await converterFotosParaBase64(values.fotosSaida || []);
        
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
          motorId: values.motorId, // Adicionamos o motor selecionado
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
          tempoRegistros: [],
          fotosEntrada: fotosEntradaBase64,
          fotosSaida: fotosSaidaBase64
        };
        
        // Recuperar ordens existentes do localStorage
        const ordensArmazenadas = localStorage.getItem('ordens');
        let ordens = [];
        
        if (ordensArmazenadas) {
          ordens = JSON.parse(ordensArmazenadas);
        }
        
        // Verificar se já existe uma ordem com o mesmo ID
        const ordemExistente = ordens.findIndex((ordem: OrdemServico) => ordem.id === newId);
        if (ordemExistente >= 0) {
          toast.error("Já existe uma ordem com este número. Use outro número de OS.");
          setIsSubmitting(false);
          return;
        }
        
        // Adicionar a nova ordem
        ordens.push(newOrder);
        
        // Salvar no localStorage
        localStorage.setItem('ordens', JSON.stringify(ordens));
        
        toast.success("Ordem de serviço criada com sucesso!");
        
        // Navegar para a página de listagem de ordens
        navigate("/ordens");
      };
      
      processarFotos();
    } catch (error) {
      console.error("Erro ao criar ordem:", error);
      toast.error("Erro ao criar ordem de serviço");
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
