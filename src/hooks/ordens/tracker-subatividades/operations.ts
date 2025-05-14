import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { fetchSubatividadesPreset } from "@/services/subatividadeService";
import { atualizarOrdemNoEstado } from "./utils";

/**
 * Hook que fornece operações para adicionar e gerenciar subatividades em serviços
 */
export const useSubatividadeOperations = (ordem?: OrdemServico, onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void) => {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);
  
  /**
   * Adiciona subatividades predefinidas a um serviço
   */
  const addSelectedSubatividades = async (servicoTipo: TipoServico, subatividadesIds: string[]): Promise<void> => {
    if (!ordem?.id) {
      console.error("Ordem não fornecida para addSelectedSubatividades");
      return Promise.reject(new Error("Ordem não fornecida"));
    }
    
    console.log("addSelectedSubatividades iniciado:", { servicoTipo, subatividadesIds, ordemId: ordem.id });
    setIsAddingSubatividades(true);
    
    try {
      // Buscar a ordem mais recente do Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnapshot = await getDoc(ordemRef);
      
      if (!ordemSnapshot.exists()) {
        throw new Error("Ordem não encontrada no Firestore");
      }
      
      // Obter dados atualizados da ordem
      const ordemData = ordemSnapshot.data() as OrdemServico;
      
      // Buscar preset de subatividades do Firestore ou usar padrões
      let presetsData = await fetchSubatividadesPreset();
      console.log("Presets de subatividades carregados:", presetsData);
      
      // Garantir que os presets incluam inspeção inicial e final
      if (servicoTipo === 'inspecao_inicial' || servicoTipo === 'inspecao_final') {
        // Verificar se já existe preset para este tipo
        const temPresetParaTipo = presetsData.some(p => p.tipo === servicoTipo);
        
        // Se não existir, adicionar preset padrão
        if (!temPresetParaTipo) {
          const subatividadesPadrao = getDefaultSubatividades(servicoTipo);
          presetsData.push({
            tipo: servicoTipo,
            subatividades: subatividadesPadrao.map((nome, index) => ({
              id: `default-${servicoTipo}-${index}`,
              nome,
              selecionada: true, // Marcar como selecionada por padrão
              concluida: false,
              tempoEstimado: 1,
              servicoTipo
            }))
          });
          
          console.log(`Adicionados presets padrão para ${servicoTipo}:`, 
                     presetsData.find(p => p.tipo === servicoTipo)?.subatividades);
        } else {
          // Garantir que as subatividades dos presets existentes estejam marcadas como selecionadas
          presetsData = presetsData.map(preset => {
            if (preset.tipo === servicoTipo && preset.subatividades) {
              return {
                ...preset,
                subatividades: preset.subatividades.map(sub => ({
                  ...sub, 
                  selecionada: true // Garantir que todas estão marcadas como selecionadas
                }))
              };
            }
            return preset;
          });
        }
      }
      
      // Encontrar o serviço a ser atualizado
      let servicoExistente = ordemData.servicos.find(s => s.tipo === servicoTipo);
      
      // Se o serviço não existir, vamos criá-lo (especialmente útil para serviços de inspeção)
      if (!servicoExistente) {
        console.log(`Serviço ${servicoTipo} não encontrado na ordem, criando um novo serviço`);
        servicoExistente = {
          tipo: servicoTipo,
          descricao: `Serviço de ${servicoTipo.replace('_', ' ')}`,
          concluido: false,
          subatividades: []
        };
        
        // Adicionar o novo serviço à ordem
        ordemData.servicos.push(servicoExistente);
      }
      
      // Inicializar array de subatividades se não existir
      if (!servicoExistente.subatividades) {
        servicoExistente.subatividades = [];
      }
      
      // Criar um mapa de subatividades existentes para fácil verificação
      const subatividadesExistentes = new Map();
      servicoExistente.subatividades.forEach(sub => {
        subatividadesExistentes.set(sub.id, sub);
      });
      
      // Filtrar presets relevantes e criar novas subatividades
      const novasSubatividades: SubAtividade[] = [];
      
      console.log("Processando subatividades selecionadas...");
      
      // Para cada ID de subatividade selecionada, buscar no preset e adicionar
      for (const subId of subatividadesIds) {
        console.log(`Processando subatividade ID: ${subId}`);
        
        // Verificar se a subatividade já existe
        if (subatividadesExistentes.has(subId)) {
          console.log(`Subatividade ${subId} já existe, atualizando`);
          
          // Atualizar flag selecionada para true
          const existingSubatividade = subatividadesExistentes.get(subId);
          existingSubatividade.selecionada = true;
          continue;
        }
        
        // Buscar todos os presets para encontrar a subatividade pelo ID
        let subatividadeEncontrada = null;
        for (const preset of presetsData) {
          const foundSub = preset.subatividades?.find(sub => sub.id === subId);
          if (foundSub) {
            subatividadeEncontrada = foundSub;
            break;
          }
        }
        
        // Se encontrou a subatividade
        if (subatividadeEncontrada) {
          console.log(`Subatividade encontrada no preset: ${subatividadeEncontrada.nome}`);
          novasSubatividades.push({
            id: subatividadeEncontrada.id,
            nome: subatividadeEncontrada.nome,
            selecionada: true, // Garantir que subatividades adicionadas sejam selecionadas
            concluida: false,
            tempoEstimado: subatividadeEncontrada.tempoEstimado || 1,
            servicoTipo: servicoTipo
          });
        } else {
          // Se não encontrou pelo ID, pode ser um ID padrão (default-*)
          if (subId.startsWith('default-')) {
            // Extrair nome da subatividade do ID (se possível)
            const parts = subId.split('-');
            if (parts.length >= 3) {
              const index = parseInt(parts[parts.length - 1]);
              const defaultSubatividades = getDefaultSubatividades(servicoTipo);
              if (index < defaultSubatividades.length) {
                const nome = defaultSubatividades[index];
                console.log(`Criando subatividade padrão: ${nome}`);
                novasSubatividades.push({
                  id: uuidv4(), // Gerar novo ID único
                  nome: nome,
                  selecionada: true, // Garantir que subatividades adicionadas sejam selecionadas
                  concluida: false,
                  tempoEstimado: 1,
                  servicoTipo: servicoTipo
                });
              }
            }
          }
        }
      }
      
      console.log(`Adicionando ${novasSubatividades.length} novas subatividades ao serviço ${servicoTipo}`);
      
      // Atualizar subatividades existentes (se a selecionada foi alterada)
      const subatividadesAtualizadas = servicoExistente.subatividades.map(sub => {
        if (subatividadesExistentes.has(sub.id)) {
          return subatividadesExistentes.get(sub.id);
        }
        return sub;
      });
      
      // Adicionar novas subatividades à lista existente
      const finalSubatividades = [
        ...subatividadesAtualizadas,
        ...novasSubatividades
      ];
      
      console.log("Subatividades finais:", finalSubatividades.length);
      console.log("Detalhes das subatividades finais:", finalSubatividades.map(s => ({
        id: s.id.substr(0, 8),
        nome: s.nome,
        selecionada: s.selecionada
      })));
      
      // Criar serviço atualizado
      const servicoAtualizado = {
        ...servicoExistente,
        subatividades: finalSubatividades
      };
      
      // Encontrar o índice do serviço na ordem
      // Se o serviço foi criado agora, ele já está no final do array
      const servicoIndex = ordemData.servicos.findIndex(s => s.tipo === servicoTipo);
      
      // Atualizar array de serviços
      const servicosAtualizados = [...ordemData.servicos];
      if (servicoIndex !== -1) {
        servicosAtualizados[servicoIndex] = servicoAtualizado;
      }
      
      // Criar objeto de atualização
      const updateData = {
        servicos: servicosAtualizados
      };
      
      // Atualizar no Firestore
      await updateDoc(ordemRef, updateData);
      
      console.log("Subatividades adicionadas com sucesso:", novasSubatividades);
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordemData,
        servicos: servicosAtualizados
      };
      
      // Chamar callback se fornecido
      if (onOrdemUpdate) {
        console.log("Chamando callback onOrdemUpdate após adicionar subatividades");
        onOrdemUpdate(ordemAtualizada);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao adicionar subatividades:", error);
      toast.error("Erro ao adicionar subatividades selecionadas");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  };
  
  /**
   * Adiciona uma subatividade personalizada a um serviço
   */
  const addCustomSubatividade = async (servicoTipo: TipoServico, nome: string, tempoEstimado: number = 1): Promise<void> => {
    if (!ordem?.id) {
      console.error("Ordem não fornecida para addCustomSubatividade");
      return Promise.reject(new Error("Ordem não fornecida"));
    }
    
    console.log("addCustomSubatividade iniciado:", { servicoTipo, nome, tempoEstimado, ordemId: ordem.id });
    setIsAddingSubatividades(true);
    
    try {
      // Buscar a ordem mais recente do Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnapshot = await getDoc(ordemRef);
      
      if (!ordemSnapshot.exists()) {
        throw new Error("Ordem não encontrada no Firestore");
      }
      
      // Obter dados atualizados da ordem
      const ordemData = ordemSnapshot.data() as OrdemServico;
      
      // Encontrar o serviço a ser atualizado
      let servicoExistente = ordemData.servicos.find(s => s.tipo === servicoTipo);
      
      // Se o serviço não existir, vamos criá-lo (especialmente útil para serviços de inspeção)
      if (!servicoExistente) {
        console.log(`Serviço ${servicoTipo} não encontrado na ordem, criando um novo serviço`);
        servicoExistente = {
          tipo: servicoTipo,
          descricao: `Serviço de ${servicoTipo.replace('_', ' ')}`,
          concluido: false,
          subatividades: []
        };
        
        // Adicionar o novo serviço à ordem
        ordemData.servicos.push(servicoExistente);
      }
      
      // Inicializar array de subatividades se não existir
      if (!servicoExistente.subatividades) {
        servicoExistente.subatividades = [];
      }
      
      // Criar nova subatividade com ID único
      const novaSubatividade: SubAtividade = {
        id: uuidv4(),
        nome: nome,
        selecionada: true, // Garantir que subatividades adicionadas sejam selecionadas
        concluida: false,
        tempoEstimado: tempoEstimado,
        servicoTipo: servicoTipo
      };
      
      // Adicionar nova subatividade à lista existente
      const subatividadesAtualizadas = [
        ...servicoExistente.subatividades,
        novaSubatividade
      ];
      
      // Criar serviço atualizado
      const servicoAtualizado = {
        ...servicoExistente,
        subatividades: subatividadesAtualizadas
      };
      
      // Encontrar o índice do serviço na ordem
      // Se o serviço foi criado agora, ele já está no final do array
      const servicoIndex = ordemData.servicos.findIndex(s => s.tipo === servicoTipo);
      
      // Atualizar array de serviços
      const servicosAtualizados = [...ordemData.servicos];
      if (servicoIndex !== -1) {
        servicosAtualizados[servicoIndex] = servicoAtualizado;
      } else {
        servicosAtualizados.push(servicoAtualizado);
      }
      
      // Criar objeto de atualização
      const updateData = {
        servicos: servicosAtualizados
      };
      
      // Atualizar no Firestore
      await updateDoc(ordemRef, updateData);
      
      console.log("Subatividade personalizada adicionada com sucesso:", novaSubatividade);
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordemData,
        servicos: servicosAtualizados
      };
      
      // Chamar callback se fornecido
      if (onOrdemUpdate) {
        console.log("Chamando callback onOrdemUpdate após adicionar subatividade personalizada");
        onOrdemUpdate(ordemAtualizada);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao adicionar subatividade personalizada:", error);
      toast.error("Erro ao adicionar subatividade personalizada");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  };
  
  return {
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  };
};

// Função auxiliar para obter subatividades padrão por tipo de serviço
function getDefaultSubatividades(servicoTipo: TipoServico): string[] {
  switch (servicoTipo) {
    case 'bloco':
      return ["Lavagem", "Inspeção", "Análise de trincas", "Retífica", "Brunimento", "Mandrilhamento"];
    case 'biela':
      return ["Inspeção", "Alinhamento", "Troca de buchas", "Balanceamento"];
    case 'cabecote':
      return ["Lavagem", "Teste de trincas", "Plano", "Assentamento de válvulas", "Sedes", "Guias"];
    case 'virabrequim':
      return ["Inspeção", "Retífica", "Polimento", "Balanceamento"];
    case 'eixo_comando':
      return ["Inspeção", "Retífica", "Balanceamento"];
    case 'montagem':
      return ["Preparação", "Montagem do cabeçote", "Montagem do bloco", "Ajustes finais", "Testes"];
    case 'dinamometro':
      return ["Potência", "Torque", "Consumo", "Análise"];
    case 'lavagem':
      return ["Preparação", "Lavagem química", "Lavagem externa", "Secagem"];
    case 'inspecao_inicial':
      return [
        "Verificação de trincas", 
        "Medição de componentes", 
        "Verificação dimensional", 
        "Análise de desgaste", 
        "Inspeção visual",
        "Análise de folgas",
        "Verificação de corrosão",
        "Detecção de vazamentos",
        "Avaliação de danos internos",
        "Registro fotográfico"
      ];
    case 'inspecao_final':
      return [
        "Verificação visual", 
        "Teste de qualidade", 
        "Conformidade com especificações", 
        "Checklist final", 
        "Aprovação técnica",
        "Verificação de montagem",
        "Teste de pressão",
        "Verificação de torque",
        "Relatório final",
        "Aprovação para entrega"
      ];
    default:
      return ["Preparação", "Execução", "Finalização"];
  }
}
