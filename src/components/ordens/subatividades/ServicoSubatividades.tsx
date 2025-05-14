
import React, { useEffect, useState } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import ServicoAtividadesConfig from "@/components/ordens/ServicoAtividadesConfig";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { toast } from "sonner";

interface ServicoSubatividadesProps {
  tipoServico: TipoServico;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  atividadeTipo?: string;
}

const ServicoSubatividades: React.FC<ServicoSubatividadesProps> = ({
  tipoServico,
  subatividades = [],
  onChange,
  atividadeTipo = "Subatividades"  // Changed from "default" to "Subatividades"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localSubatividades, setLocalSubatividades] = useState<SubAtividade[]>(subatividades);
  const { defaultSubatividades } = useServicoSubatividades();
  const [dataSource, setDataSource] = useState<"banco" | "básico" | "props">("props");
  
  // Priorizar subatividades fornecidas via props (da edição)
  useEffect(() => {
    if (subatividades && subatividades.length > 0) {
      console.log(`[ServicoSubatividades] Usando subatividades das props para ${tipoServico}:`, subatividades);
      setLocalSubatividades(subatividades);
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
            selecionada: sub.selecionada ?? true,
            concluida: sub.concluida ?? false
          }));
          setLocalSubatividades(mappedSubs);
          setDataSource("banco");
          onChange(mappedSubs);
        } else {
          console.log(`[ServicoSubatividades] Nenhuma subatividade encontrada no banco para ${tipoServico}, usando básicos`);
          // Usar padrões apenas se não tiver subatividades no banco de dados
          const defaultSubs = defaultSubatividades[tipoServico]?.map(nome => ({
            id: nome,
            nome,
            selecionada: true,
            concluida: false
          })) || [];
          
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
          selecionada: true,
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
  
  // Update local state when subatividades change from props
  useEffect(() => {
    if (subatividades && subatividades.length > 0) {
      console.log(`[ServicoSubatividades] Atualizando subatividades para ${tipoServico} a partir das props:`, subatividades);
      setLocalSubatividades(subatividades);
    }
  }, [subatividades, tipoServico]);
  
  const handleSubatividadesChange = (updatedSubatividades: SubAtividade[]) => {
    console.log(`[ServicoSubatividades] Alterações em subatividades para ${tipoServico}:`, updatedSubatividades);
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
        atividadeTipo={atividadeTipo as any}
        subatividades={localSubatividades}
        onChange={handleSubatividadesChange}
      />
    </div>
  );
};

export default ServicoSubatividades;
