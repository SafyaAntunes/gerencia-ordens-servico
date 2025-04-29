
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SubAtividade } from "@/types/ordens";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { PresetSubatividades } from "./PresetSubatividades";
import { CustomSubatividadesForm } from "./CustomSubatividadesForm";
import { CustomSubatividadesList } from "./CustomSubatividadesList";
import { Skeleton } from "@/components/ui/skeleton";

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
      const subsSelecionadas = new Set(subatividades.map(s => s.id));
      
      const combinadas = resultado.map(sub => {
        const existente = subatividades.find(s => s.id === sub.id);
        if (existente) {
          return {
            ...sub,
            selecionada: true,
            tempoEstimado: existente.tempoEstimado || sub.tempoEstimado || 0
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
    
    const updatedSubs = subatividades.map((sub) => {
      if (sub.id === id) {
        return { ...sub, selecionada: checked };
      }
      return sub;
    });

    // Se não existe na lista de subatividades, adiciona
    if (!updatedSubs.some((sub) => sub.id === id)) {
      const subToAdd = presetSubatividades.find((sub) => sub.id === id);
      if (subToAdd) {
        updatedSubs.push({
          ...subToAdd,
          selecionada: checked,
          tempoEstimado: subToAdd.tempoEstimado || 0
        });
      }
    }

    onChange(updatedSubs.filter((sub) => sub.selecionada));
  };

  const handleAddCustom = () => {
    if (!customSubatividade.trim() || !editable) return;

    const newSub: SubAtividade = {
      id: `custom-${Date.now()}`,
      nome: customSubatividade.trim(),
      selecionada: true,
      tempoEstimado: 0,
    };

    onChange([...subatividades, newSub]);
    setCustomSubatividade("");
    setIsAddingCustom(false);
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
        />
      )}

      <CustomSubatividadesList 
        subatividades={subatividades}
        presetSubatividades={presetSubatividades}
        editable={editable}
        onToggleSubatividade={handleToggleSubatividade}
        onTempoEstimadoChange={handleTempoEstimadoChange}
      />
    </div>
  );
}
