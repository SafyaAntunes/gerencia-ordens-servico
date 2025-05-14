
import React, { useEffect, useState } from "react";
import { SubAtividade, TipoServico, TipoAtividade } from "@/types/ordens";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import ServicoAtividadesConfig from "@/components/ordens/ServicoAtividadesConfig";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { toast } from "sonner";
import { useTrackingSubatividades } from "@/hooks/ordens/useTrackingSubatividades";
import { useServicosDebug } from "@/hooks/ordens/useServicosDebug";

interface ServicoSubatividadesProps {
  tipoServico: TipoServico;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  atividadeTipo?: TipoAtividade | "Subatividades";
}

const ServicoSubatividades: React.FC<ServicoSubatividadesProps> = ({
  tipoServico,
  subatividades = [],
  onChange,
  atividadeTipo = "Subatividades"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localSubatividades, setLocalSubatividades] = useState<SubAtividade[]>(subatividades);
  const { defaultSubatividades } = useServicoSubatividades();
  const [dataSource, setDataSource] = useState<"banco" | "básico" | "props">("props");
  const { logSubatividadesState } = useTrackingSubatividades();
  const { logSubatividades } = useServicosDebug('ServicoSubatividades');
  
  // Depuração inicial das subatividades recebidas via props
  useEffect(() => {
    logSubatividades('inicialização', tipoServico, subatividades);
  }, []);
  
  // PRIORITIZAR subatividades das props e preservar seu estado 'selecionada'
  useEffect(() => {
    if (subatividades && subatividades.length > 0) {
      logSubatividades('props-update', tipoServico, subatividades);
      
      // IMPORTANTE: Preservar o estado 'selecionada' de cada subatividade
      // CORREÇÃO CRÍTICA: Definir como default TRUE, não FALSE para subatividades undefined
      const processedSubs = subatividades.map(sub => ({
        ...sub,
        // Apenas definir como TRUE se for undefined
        selecionada: sub.selecionada !== undefined ? sub.selecionada : true
      }));
      
      // Log para depuração - verificar o estado 'selecionada' após processamento
      logSubatividades('processamento', tipoServico, processedSubs);
      
      setLocalSubatividades(processedSubs);
      setDataSource("props");
      return;
    }
    
    const loadFromDatabase = async () => {
      setIsLoading(true);
      try {
        console.log(`[ServicoSubatividades] Buscando subatividades do banco para ${tipoServico}...`);
        const dbSubatividades = await getSubatividadesByTipo(tipoServico);
        
        if (dbSubatividades && dbSubatividades.length > 0) {
          console.log(`[ServicoSubatividades] Encontradas ${dbSubatividades.length} subatividades no banco para ${tipoServico}:`, dbSubatividades);
          // Mapear para garantir que todas tenham o estado selecionada e concluída
          const mappedSubs = dbSubatividades.map(sub => ({
            ...sub,
            selecionada: sub.selecionada ?? true, // DEFAULT TRUE
            concluida: sub.concluida ?? false
          }));
          
          logSubatividades('banco-carregadas', tipoServico, mappedSubs);
          
          setLocalSubatividades(mappedSubs);
          setDataSource("banco");
          onChange(mappedSubs);
        } else {
          console.log(`[ServicoSubatividades] Nenhuma subatividade encontrada no banco para ${tipoServico}, usando básicos`);
          // Usar padrões apenas se não tiver subatividades no banco de dados
          const defaultSubs = defaultSubatividades[tipoServico]?.map(nome => ({
            id: nome,
            nome,
            selecionada: true, // SEMPRE TRUE para defaults
            concluida: false
          })) || [];
          
          logSubatividades('default-criadas', tipoServico, defaultSubs);
          
          setLocalSubatividades(defaultSubs);
          setDataSource("básico");
          onChange(defaultSubs);
        }
      } catch (error) {
        console.error(`[ServicoSubatividades] Erro ao carregar subatividades para ${tipoServico}:`, error);
        toast.error(`Erro ao carregar subatividades para ${tipoServico}`);
        
        // Fallback to defaults on error
        const defaultSubs = defaultSubatividades[tipoServico]?.map(nome => ({
          id: nome,
          nome,
          selecionada: true, // SEMPRE TRUE para defaults 
          concluida: false
        })) || [];
        
        setLocalSubatividades(defaultSubs);
        setDataSource("básico");
        onChange(defaultSubs);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFromDatabase();
  }, [tipoServico, onChange, defaultSubatividades]);
  
  // Importante: Atualizar quando as props mudarem, mantendo seleções
  useEffect(() => {
    if (subatividades && subatividades.length > 0) {
      logSubatividades('props-changed', tipoServico, subatividades);
      
      // MELHORIA: Preservar o estado 'selecionada'
      // CORREÇÃO CRÍTICA: Default é TRUE não FALSE
      const updatedSubs = subatividades.map(sub => ({
        ...sub,
        selecionada: sub.selecionada !== undefined ? sub.selecionada : true
      }));
      
      setLocalSubatividades(updatedSubs);
    }
  }, [subatividades, tipoServico]);
  
  const handleSubatividadesChange = (updatedSubatividades: SubAtividade[]) => {
    logSubatividades('handle-change', tipoServico, updatedSubatividades);
    setLocalSubatividades(updatedSubatividades);
    onChange(updatedSubatividades);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-2">Carregando subatividades...</div>;
  }

  return (
    <div>
      {dataSource === "básico" && (
        <div className="text-sm text-amber-600 mb-2">
          ⚠️ Usando subatividades básicas. As configurações não foram encontradas no banco de dados.
        </div>
      )}
      
      <ServicoAtividadesConfig
        servicoTipo={tipoServico}
        atividadeTipo={atividadeTipo}
        subatividades={localSubatividades}
        onChange={handleSubatividadesChange}
      />
    </div>
  );
};

export default ServicoSubatividades;
