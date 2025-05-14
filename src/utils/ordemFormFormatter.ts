import { FormValues } from "@/components/ordens/form/types";
import { OrdemServico, StatusOS, TipoServico, Cliente, Servico } from "@/types/ordens";

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
  // Construir objeto de serviços preservando subatividades existentes
  const servicos = (formData.servicosTipos || []).map(tipo => {
    const servicoExistente = ordemExistente?.servicos.find(s => s.tipo === tipo as TipoServico);
    
    return {
      tipo: tipo as TipoServico,
      descricao: formData.servicosDescricoes?.[tipo] || "",
      concluido: servicoExistente?.concluido || false,
      subatividades: servicoExistente?.subatividades || [],
      funcionarioId: servicoExistente?.funcionarioId || undefined,
      funcionarioNome: servicoExistente?.funcionarioNome || undefined,
      dataConclusao: servicoExistente?.dataConclusao
    } as Servico;
  });

  // Construir objeto de ordem
  const cliente: Cliente = ordemExistente?.cliente || {
    id: formData.clienteId,
    nome: "",
    telefone: "",
    email: ""
  };

  const ordemAtualizada: OrdemServico = {
    id: formData.id || ordemExistente?.id || "",
    nome: formData.nome,
    cliente,
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
