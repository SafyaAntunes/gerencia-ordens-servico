
import { useState, useEffect } from "react";
import { getDocs, collection, query, where, updateDoc, doc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SubAtividade, TipoServico, TipoAtividade } from "@/types/ordens";

interface ConfiguracaoItem {
  tipo: TipoServico;
  nome: string;
  horaPadrao: string;
  tempoPadrao: number;
}

export const useConfiguracoesServico = (tipoAtividade?: TipoAtividade) => {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subatividades, setSubatividades] = useState<SubAtividade[]>([]);
  const [itens, setItens] = useState<ConfiguracaoItem[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<TipoServico | ''>('');

  // Fetch subatividades based on selected tipo
  useEffect(() => {
    const fetchSubatividades = async () => {
      if (!selectedTipo) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, "subatividades"),
          where("servicoTipo", "==", selectedTipo)
        );
        
        const querySnapshot = await getDocs(q);
        
        const items: SubAtividade[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as SubAtividade);
        });
        
        setSubatividades(items);
      } catch (error) {
        console.error("Error fetching subatividades:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubatividades();
  }, [selectedTipo]);

  // Fetch configuracoes (itens) based on tipoAtividade
  useEffect(() => {
    if (!tipoAtividade) return;
    
    const fetchConfiguracoes = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "configuracoes_atividades"),
          where("tipoAtividade", "==", tipoAtividade)
        );
        
        const querySnapshot = await getDocs(q);
        
        const configuracoes: ConfiguracaoItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          configuracoes.push({
            tipo: data.tipo,
            nome: data.nome,
            horaPadrao: data.horaPadrao || "00:30",
            tempoPadrao: data.tempoPadrao || 30
          });
        });
        
        // If no configurations found, initialize with defaults for all service types
        if (configuracoes.length === 0) {
          allServicoOptions.forEach(option => {
            configuracoes.push({
              tipo: option.value,
              nome: option.label,
              horaPadrao: "00:30",
              tempoPadrao: 30
            });
          });
        }
        
        setItens(configuracoes);
      } catch (error) {
        console.error("Error fetching configuracoes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfiguracoes();
  }, [tipoAtividade]);

  const atualizarItem = (tipo: TipoServico, campo: 'horaPadrao' | 'tempoPadrao', valor: string | number) => {
    setItens(prev => {
      return prev.map(item => {
        if (item.tipo === tipo) {
          return { ...item, [campo]: valor };
        }
        return item;
      });
    });
  };

  const salvarConfiguracoes = async () => {
    if (!tipoAtividade) return false;
    
    setIsSaving(true);
    try {
      // Buscar configurações existentes
      const q = query(
        collection(db, "configuracoes_atividades"),
        where("tipoAtividade", "==", tipoAtividade)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Para cada item de configuração
      for (const item of itens) {
        // Verificar se já existe uma configuração para este tipo de serviço
        const existingConfig = querySnapshot.docs.find(
          doc => doc.data().tipo === item.tipo
        );
        
        if (existingConfig) {
          // Atualizar a configuração existente
          await updateDoc(doc(db, "configuracoes_atividades", existingConfig.id), {
            horaPadrao: item.horaPadrao,
            tempoPadrao: item.tempoPadrao,
            updatedAt: new Date()
          });
        } else {
          // Criar nova configuração - Corrigido o método de criação de documento
          await addDoc(collection(db, "configuracoes_atividades"), {
            tipoAtividade,
            tipo: item.tipo,
            nome: item.nome,
            horaPadrao: item.horaPadrao,
            tempoPadrao: item.tempoPadrao,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const allServicoOptions = [
    {value: TipoServico.BLOCO, label: "Bloco"},
    {value: TipoServico.BIELA, label: "Biela"},
    {value: TipoServico.CABECOTE, label: "Cabeçote"},
    {value: TipoServico.VIRABREQUIM, label: "Virabrequim"},
    {value: TipoServico.EIXO_COMANDO, label: "Eixo de Comando"},
    {value: TipoServico.MONTAGEM, label: "Montagem"},
    {value: TipoServico.DINAMOMETRO, label: "Dinamômetro"},
    {value: TipoServico.LAVAGEM, label: "Lavagem"},
    {value: TipoServico.INSPECAO_INICIAL, label: "Inspeção Inicial"},
    {value: TipoServico.INSPECAO_FINAL, label: "Inspeção Final"},
  ];

  return {
    loading,
    isLoading: loading,
    isSaving,
    subatividades,
    itens,
    allServicoOptions,
    selectedTipo,
    setSelectedTipo,
    atualizarItem,
    salvarConfiguracoes
  };
};
