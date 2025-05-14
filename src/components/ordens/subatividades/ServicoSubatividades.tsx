import React, { useEffect, useState } from "react";
import { SubAtividade, TipoServico, TipoAtividade } from "@/types/ordens";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import ServicoAtividadesConfig from "@/components/ordens/ServicoAtividadesConfig";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { toast } from "sonner";

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
  
  // Depuração inicial das subatividades recebidas via props
  useEffect(() => {
    console.log(`[ServicoSubatividades] INICIALIZAÇÃO - subatividades para ${tipoServico}:`, 
      subatividades.map(sub => ({
        id: sub.id,
        nome: sub.nome,
        selecionada: sub.selecionada,
        concluida: sub.concluida
      }))
    );
  }, []);
  
  // PRIORITIZAR subatividades das props e preservar seu estado 'selecionada'
  useEffect(() => {
    if (subatividades && subatividades.length > 0) {
      console.log(`[ServicoSubatividades] Usando subatividades das props para ${tipoServico}:`, 
        subatividades.map(s => ({
          id: s.id, 
          nome: s.nome, 
          selecionada: s.selecionada !== undefined ? s.selecionada : false,
          concluida: s.concluida
        }))
      );
      
      // IMPORTANTE: Preservar o estado 'selecionada' de cada subatividade sem modificá-lo
      const processedSubs = subatividades.map(sub => ({
        ...sub,
        // Apenas definir como false se for undefined
        selecionada: sub.selecionada !== undefined ? sub.selecionada : false
      }));
      
      // Log para depuração - verificar o estado 'selecionada' após processamento
      console.log(`[ServicoSubatividades] Estado 'selecionada' após processamento:`, 
        processedSubs.map(sub => ({ 
          id: sub.id, 
          nome: sub.nome, 
          selecionada: sub.selecionada,
          concluida: sub.concluida
        }))
      );
      
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
  
  // Importante: Atualizar quando as props mudarem, mantendo seleções
  useEffect(() => {
    if (subatividades && subatividades.length > 0) {
      console.log(`[ServicoSubatividades] Atualizando subatividades para ${tipoServico} a partir das props:`, 
        subatividades.map(sub => ({ 
          id: sub.id, 
          nome: sub.nome, 
          selecionada: sub.selecionada !== undefined ? sub.selecionada : false,
          concluida: sub.concluida 
        })));
      
      // MELHORIA: Preservar o estado 'selecionada' sem modificá-lo
      const updatedSubs = subatividades.map(sub => ({
        ...sub,
        selecionada: sub.selecionada !== undefined ? sub.selecionada : false
      }));
      
      setLocalSubatividades(updatedSubs);
    }
  }, [subatividades, tipoServico]);
  
  const handleSubatividadesChange = (updatedSubatividades: SubAtividade[]) => {
    console.log(`[ServicoSubatividades] Alterações em subatividades para ${tipoServico}:`, 
      updatedSubatividades.map(sub => ({ 
        id: sub.id, 
        nome: sub.nome, 
        selecionada: sub.selecionada,
        concluida: sub.concluida
      })));
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
