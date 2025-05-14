
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { fetchSubatividadesPreset } from '@/services/subatividadeService';
import { TipoServico, SubAtividade } from "@/types/ordens";
import { toast } from "sonner";

interface SubatividadeSelectorProps {
  tipoServico: TipoServico;
  onConfirm: (selecionadas: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SubatividadeSelector({
  tipoServico,
  onConfirm,
  onCancel,
  isLoading = false
}: SubatividadeSelectorProps) {
  const [subatividades, setSubatividades] = useState<SubAtividade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubatividades, setSelectedSubatividades] = useState<string[]>([]);

  useEffect(() => {
    async function carregarSubatividades() {
      try {
        setLoading(true);
        
        // Buscar todas as subatividades predefinidas
        const resultado = await fetchSubatividadesPreset();
        
        // Encontrar o conjunto de subatividades para este tipo de serviço
        const subatividadesDoTipo = resultado.find(item => item.tipo === tipoServico)?.subatividades || [];
        
        // Verificar se encontrou subatividades
        console.log(`SubatividadeSelector: Encontradas ${subatividadesDoTipo.length} subatividades para ${tipoServico}`);
        
        setSubatividades(subatividadesDoTipo);
      } catch (error) {
        console.error("Erro ao carregar subatividades predefinidas:", error);
        toast.error("Não foi possível carregar as subatividades predefinidas");
      } finally {
        setLoading(false);
      }
    }
    
    carregarSubatividades();
  }, [tipoServico]);

  const handleToggleSubatividade = (id: string) => {
    setSelectedSubatividades(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedSubatividades);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (subatividades.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-4">Nenhuma subatividade predefinida para {tipoServico}</p>
        <Button onClick={onCancel}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-[400px] overflow-y-auto p-2">
        {subatividades.map((subatividade) => (
          <div key={subatividade.id} className="flex items-start space-x-2 p-2 border rounded hover:bg-muted/50">
            <Checkbox
              id={subatividade.id}
              checked={selectedSubatividades.includes(subatividade.id)}
              onCheckedChange={() => handleToggleSubatividade(subatividade.id)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={subatividade.id}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {subatividade.nome}
              </label>
              {subatividade.tempoEstimado && (
                <p className="text-xs text-muted-foreground">
                  Tempo estimado: {subatividade.tempoEstimado}h
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={isLoading || selectedSubatividades.length === 0}
        >
          {isLoading ? "Adicionando..." : `Adicionar (${selectedSubatividades.length})`}
        </Button>
      </div>
    </div>
  );
}
