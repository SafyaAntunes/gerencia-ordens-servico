
import { FormValues } from "@/components/ordens/form/types";
import { OrdemServico, StatusOS } from "@/types/ordens";

/**
 * Formata os dados da ordem para o formato do formulário
 */
export const formatFormDataFromOrdem = (ordem: OrdemServico): FormValues => {
  // Extrair serviços e descricoes
  const servicosTipos = ordem.servicos.map(s => s.tipo);
  const servicosDescricoes: Record<string, string> = {};
  const servicosSubatividades: Record<string, any[]> = {};
  
  ordem.servicos.forEach(servico => {
    servicosDescricoes[servico.tipo] = servico.descricao;
    if (servico.subatividades && servico.subatividades.length > 0) {
      servicosSubatividades[servico.tipo] = servico.subatividades;
    }
  });
  
  // Extrair etapas tempo/preco se disponível
  const etapasTempoPreco = ordem.etapasAndamento || {};

  return {
    id: ordem.id,
    nome: ordem.nome,
    clienteId: ordem.cliente?.id || "",
    motorId: ordem.motorId || "",
    dataAbertura: new Date(ordem.dataAbertura),
    dataPrevistaEntrega: new Date(ordem.dataPrevistaEntrega),
    prioridade: ordem.prioridade,
    servicosTipos,
    servicosDescricoes,
    servicosSubatividades,
    etapasTempoPreco
  };
};

/**
 * Formata os dados do formulário para o formato da ordem
 */
export const formatOrdemFromFormData = (formData: FormValues, ordemExistente?: OrdemServico): OrdemServico => {
  // Construir objeto de serviços
  const servicos = (formData.servicosTipos || []).map(tipo => {
    const servicoExistente = ordemExistente?.servicos.find(s => s.tipo === tipo) || {};
    
    return {
      tipo,
      descricao: formData.servicosDescricoes?.[tipo] || "",
      concluido: servicoExistente.concluido || false,
      // Não vamos mais incluir subatividades aqui, elas serão gerenciadas pelo tracker
      // subatividades: formData.servicosSubatividades?.[tipo] || [],
      funcionarioId: servicoExistente.funcionarioId,
      funcionarioNome: servicoExistente.funcionarioNome,
      dataConclusao: servicoExistente.dataConclusao
    };
  });

  // Construir objeto de ordem
  const ordemAtualizada: OrdemServico = {
    id: formData.id || ordemExistente?.id || "",
    nome: formData.nome,
    cliente: ordemExistente?.cliente || { id: formData.clienteId, nome: "" },
    motorId: formData.motorId,
    dataAbertura: formData.dataAbertura,
    dataPrevistaEntrega: formData.dataPrevistaEntrega,
    prioridade: formData.prioridade,
    servicos,
    status: ordemExistente?.status || "fabricacao",
    etapasAndamento: ordemExistente?.etapasAndamento || {},
    tempoRegistros: ordemExistente?.tempoRegistros || []
  };

  return ordemAtualizada;
};
