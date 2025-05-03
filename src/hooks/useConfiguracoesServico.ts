
import { useState, useEffect } from "react";
import { TipoServico, TipoAtividade } from "@/types/ordens";
import { toast } from "sonner";

interface ConfiguracaoItem {
  tipo: TipoServico;
  nome: string;
  horaPadrao: string;
  tempoPadrao: number; // Changed from valorHora to tempoPadrao
}

export function useConfiguracoesServico(tipoAtividade: TipoAtividade) {
  const [itens, setItens] = useState<ConfiguracaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mapeamento de tipos de serviço para nomes amigáveis
  const servicoNomes: Record<TipoServico, string> = {
    bloco: "BLOCO",
    biela: "BIELA",
    cabecote: "CABEÇOTE",
    virabrequim: "VIRABREQUIM",
    eixo_comando: "EIXO DE COMANDO",
    montagem: "MONTAGEM",
    dinamometro: "DINAMÔMETRO",
    lavagem: "LAVAGEM"
  };
  
  // Tipos de serviço disponíveis
  const tiposServico: TipoServico[] = [
    "bloco", 
    "biela", 
    "cabecote", 
    "virabrequim", 
    "eixo_comando", 
    "montagem", 
    "dinamometro", 
    "lavagem"
  ];
  
  // Carregar configurações do localStorage ou inicializar com valores padrão
  useEffect(() => {
    const carregarConfiguracoes = () => {
      setIsLoading(true);
      try {
        const configSalva = localStorage.getItem(`configuracao_${tipoAtividade}`);
        
        if (configSalva) {
          setItens(JSON.parse(configSalva));
        } else {
          // Inicializar com valores padrão
          const itensIniciais = tiposServico.map(tipo => ({
            tipo,
            nome: servicoNomes[tipo],
            horaPadrao: "01:00",
            tempoPadrao: 1.0 // Default time in hours
          }));
          setItens(itensIniciais);
        }
      } catch (error) {
        console.error(`Erro ao carregar configurações de ${tipoAtividade}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarConfiguracoes();
  }, [tipoAtividade]);
  
  // Atualizar um item de configuração
  const atualizarItem = (tipo: TipoServico, campo: 'horaPadrao' | 'tempoPadrao', valor: string | number) => {
    setItens(prev => prev.map(item => {
      if (item.tipo === tipo) {
        return { ...item, [campo]: valor };
      }
      return item;
    }));
  };
  
  // Salvar configurações no localStorage
  const salvarConfiguracoes = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`configuracao_${tipoAtividade}`, JSON.stringify(itens));
      return true;
    } catch (error) {
      console.error(`Erro ao salvar configurações de ${tipoAtividade}:`, error);
      toast.error(`Erro ao salvar configurações de ${formatarTipoAtividade(tipoAtividade)}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatarTipoAtividade = (tipo: TipoAtividade): string => {
    switch (tipo) {
      case 'lavagem': return 'Lavagem';
      case 'inspecao_inicial': return 'Inspeção Inicial';
      case 'inspecao_final': return 'Inspeção Final';
      default: return tipo;
    }
  };
  
  return {
    itens,
    isLoading,
    isSaving,
    atualizarItem,
    salvarConfiguracoes
  };
}
