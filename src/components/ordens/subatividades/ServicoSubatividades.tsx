
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SubAtividade } from "@/types/ordens";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { PresetSubatividades } from "./PresetSubatividades";
import { CustomSubatividadesForm } from "./CustomSubatividadesForm";
import { CustomSubatividadesList } from "./CustomSubatividadesList";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";

interface ServicoSubatividadesProps {
  tipoServico: string;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  editable?: boolean;
}

export function ServicoSubatividades({
  tipoServico,
  subatividades = [],
  onChange,
  editable = true,
}: ServicoSubatividadesProps) {
  const [customSubatividade, setCustomSubatividade] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [presetSubatividades, setPresetSubatividades] = useState<SubAtividade[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (tipoServico) {
      carregarSubatividades();
    }
  }, [tipoServico]);

  const carregarSubatividades = async () => {
    try {
      setIsLoading(true);
      const tipoServicoFormatado = tipoServico.toLowerCase().replace(/\s+/g, '_');
      const resultado = await getSubatividadesByTipo(tipoServicoFormatado as any);
      
      // Combina subatividades já selecionadas com as pré-cadastradas
      const combinadas = resultado.map(sub => {
        const existente = subatividades.find(s => s.id === sub.id);
        if (existente) {
          return {
            ...sub,
            selecionada: true,
            tempoEstimado: existente.tempoEstimado || sub.tempoEstimado || 0,
            concluida: existente.concluida // Preservar estado concluída
          };
        }
        return sub;
      });
      
      setPresetSubatividades(combinadas);
    } catch (error) {
      console.error("Erro ao carregar subatividades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as subatividades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubatividade = (id: string, checked: boolean) => {
    if (!editable) return;
    
    const updatedSubs = [...subatividades];
    const existingIndex = updatedSubs.findIndex(sub => sub.id === id);
    
    if (existingIndex >= 0) {
      // Atualiza subatividade existente
      updatedSubs[existingIndex] = {
        ...updatedSubs[existingIndex],
        selecionada: checked,
        // Preservar estado concluída se existir
        concluida: updatedSubs[existingIndex].concluida
      };
    } else if (checked) {
      // Adiciona nova subatividade da lista de presets
      const subToAdd = presetSubatividades.find(sub => sub.id === id);
      if (subToAdd) {
        updatedSubs.push({
          ...subToAdd,
          selecionada: true,
          tempoEstimado: subToAdd.tempoEstimado || 0
        });
      }
    }
    
    onChange(updatedSubs.filter(sub => sub.selecionada));
  };

  const handleAddCustom = () => {
    if (!customSubatividade.trim() || !editable) return;

    const newSub: SubAtividade = {
      id: `custom-${uuidv4()}`,
      nome: customSubatividade.trim(),
      selecionada: true,
      tempoEstimado: 0,
    };

    onChange([...subatividades, newSub]);
    setCustomSubatividade("");
    setIsAddingCustom(false);
    
    toast({
      title: "Subatividade adicionada",
      description: `A subatividade "${newSub.nome}" foi adicionada com sucesso.`,
    });
  };

  const handleTempoEstimadoChange = (id: string, horas: number) => {
    if (!editable) return;
    
    const updatedSubs = subatividades.map((sub) => {
      if (sub.id === id) {
        return { ...sub, tempoEstimado: horas };
      }
      return sub;
    });
    
    onChange(updatedSubs);
  };
  
  // Função para remover subatividade personalizada
  const handleRemoveSubatividade = (id: string) => {
    if (!editable) return;
    
    const updatedSubs = subatividades.filter(sub => sub.id !== id);
    onChange(updatedSubs);
    
    toast({
      title: "Subatividade removida",
      description: "A subatividade personalizada foi removida com sucesso.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PresetSubatividades 
        presetSubatividades={presetSubatividades} 
        subatividades={subatividades}
        editable={editable}
        onToggleSubatividade={handleToggleSubatividade}
        onTempoEstimadoChange={handleTempoEstimadoChange}
      />

      {editable && (
        <CustomSubatividadesForm
          customSubatividade={customSubatividade}
          isAddingCustom={isAddingCustom}
          setCustomSubatividade={setCustomSubatividade}
          setIsAddingCustom={setIsAddingCustom}
          onAddCustom={handleAddCustom}
          onAdd={handleAddCustom}
          onCancel={() => setIsAddingCustom(false)}
          disabled={false}
        />
      )}

      <CustomSubatividadesList 
        subatividades={subatividades}
        presetSubatividades={presetSubatividades}
        editable={editable}
        onToggleSubatividade={handleToggleSubatividade}
        onTempoEstimadoChange={handleTempoEstimadoChange}
        onToggle={handleToggleSubatividade}
        onRemove={handleRemoveSubatividade}
        disabled={!editable}
      />
    </div>
  );
}
