
import { useState, useEffect, useCallback } from "react";
import { OrdemServico, Servico, TipoServico, EtapaOS } from "@/types/ordens";

interface UseEtapaOperationsProps {
  ordem: OrdemServico;
  onUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function useEtapaOperations({ ordem, onUpdate }: UseEtapaOperationsProps) {
  // Get services for a specific etapa
  const getServicosEtapa = (etapa: EtapaOS, tipoServico?: TipoServico): Servico[] => {
    const result: Servico[] = [];
    
    // Log para debugging da função
    console.log(`getServicosEtapa - Buscando serviços para etapa: ${etapa}, tipoServico: ${tipoServico || 'todos'}`);
    console.log(`getServicosEtapa - Total de serviços na ordem: ${ordem.servicos.length}`);
    
    ordem.servicos.forEach(servico => {
      let servicoEtapa: EtapaOS | undefined;
      
      // Mapeamento de tipo de serviço para etapa
      if (servico.tipo === 'lavagem') {
        servicoEtapa = 'lavagem';
      } else if (servico.tipo === 'inspecao_inicial') {
        servicoEtapa = 'inspecao_inicial';
      } else if (servico.tipo === 'inspecao_final') {
        servicoEtapa = 'inspecao_final';
      } else if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)) {
        servicoEtapa = 'retifica';
      } else if (servico.tipo === 'montagem') {
        servicoEtapa = 'montagem';
      } else if (servico.tipo === 'dinamometro') {
        servicoEtapa = 'dinamometro';
      }
      
      // Lógica específica para serviços de inspeção
      if (etapa === 'inspecao_inicial' || etapa === 'inspecao_final') {
        // Caso 1: Se estamos procurando um serviço específico (ex: bloco) para inspeção
        if (tipoServico && tipoServico !== etapa) {
          // Adicionar apenas se o tipo corresponder ao solicitado
          if (servico.tipo === tipoServico) {
            console.log(`getServicosEtapa - Adicionando serviço ${servico.tipo} para inspeção específica`);
            result.push(servico);
          }
        }
        // Caso 2: Se estamos procurando o próprio serviço de inspeção
        else if (tipoServico === etapa || !tipoServico) {
          // Adicionar o serviço de inspeção propriamente dito
          if (servico.tipo === etapa) {
            console.log(`getServicosEtapa - Adicionando serviço de inspeção ${servico.tipo}`);
            result.push(servico);
          }
        }
      }
      // Lógica padrão para outras etapas (não inspeção)
      else if (servicoEtapa === etapa) {
        console.log(`getServicosEtapa - Adicionando serviço ${servico.tipo} para etapa ${etapa}`);
        result.push(servico);
      }
    });
    
    console.log(`getServicosEtapa - Total de serviços encontrados para ${etapa}: ${result.length}`);
    return result;
  };
  
  // Get stage info
  const getEtapaInfo = (etapa: EtapaOS, servicoTipo?: TipoServico) => {
    if (!ordem.etapasAndamento) return {};
    
    const info = ordem.etapasAndamento[etapa];
    
    // For inspection stages, we need to check if the service type matches
    if ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) {
      if (info && info.servicoTipo === servicoTipo) {
        return info;
      }
      return {};
    }
    
    return info || {};
  };
  
  // Handle subactivity toggle
  const handleSubatividadeToggle = (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    const servicosAtualizados = ordem.servicos.map(servico => {
      if (servico.tipo === servicoTipo && servico.subatividades) {
        const subatividadesAtualizadas = servico.subatividades.map(sub => {
          if (sub.id === subatividadeId) {
            return { ...sub, concluida: checked };
          }
          return sub;
        });
        
        return { ...servico, subatividades: subatividadesAtualizadas };
      }
      return servico;
    });
    
    const ordemAtualizada = { ...ordem, servicos: servicosAtualizados };
    onUpdate(ordemAtualizada);
  };
  
  // Handle service status change
  const handleServicoStatusChange = (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => {
    const servicosAtualizados = ordem.servicos.map(servico => {
      if (servico.tipo === servicoTipo) {
        return { 
          ...servico, 
          concluido,
          funcionarioId: funcionarioId || servico.funcionarioId,
          funcionarioNome: funcionarioNome || servico.funcionarioNome,
          dataConclusao: concluido ? new Date() : undefined
        };
      }
      return servico;
    });
    
    const ordemAtualizada = { ...ordem, servicos: servicosAtualizados };
    onUpdate(ordemAtualizada);
  };
  
  // Handle etapa status change
  const handleEtapaStatusChange = (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => {
    const etapasAndamentoAtualizadas = { ...ordem.etapasAndamento };
    
    if (!etapasAndamentoAtualizadas[etapa]) {
      etapasAndamentoAtualizadas[etapa] = { concluido: false };
    }
    
    etapasAndamentoAtualizadas[etapa] = {
      ...etapasAndamentoAtualizadas[etapa],
      concluido: concluida,
      finalizado: concluida ? new Date() : undefined,
      iniciado: etapasAndamentoAtualizadas[etapa]?.iniciado || new Date(),
      funcionarioId: funcionarioId || etapasAndamentoAtualizadas[etapa]?.funcionarioId,
      funcionarioNome: funcionarioNome || etapasAndamentoAtualizadas[etapa]?.funcionarioNome,
      servicoTipo: servicoTipo
    };
    
    const ordemAtualizada = { 
      ...ordem, 
      etapasAndamento: etapasAndamentoAtualizadas
    };
    
    onUpdate(ordemAtualizada);
  };
  
  // Handle subatividade selecionada toggle
  const handleSubatividadeSelecionadaToggle = (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    console.log(`handleSubatividadeSelecionadaToggle - Alterando seleção de subatividade: ${subatividadeId}, valor: ${checked}`);
    
    const servicosAtualizados = ordem.servicos.map(servico => {
      if (servico.tipo === servicoTipo && servico.subatividades) {
        const subatividadesAtualizadas = servico.subatividades.map(sub => {
          if (sub.id === subatividadeId) {
            return { ...sub, selecionada: checked };
          }
          return sub;
        });
        
        return { ...servico, subatividades: subatividadesAtualizadas };
      }
      return servico;
    });
    
    const ordemAtualizada = { ...ordem, servicos: servicosAtualizados };
    onUpdate(ordemAtualizada);
  };
  
  return {
    getServicosEtapa,
    getEtapaInfo,
    handleSubatividadeToggle,
    handleServicoStatusChange,
    handleEtapaStatusChange,
    handleSubatividadeSelecionadaToggle
  };
}
