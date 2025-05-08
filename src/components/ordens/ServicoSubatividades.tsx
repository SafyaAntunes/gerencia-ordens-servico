
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { Plus, Trash, X } from "lucide-react";
import CustomSubatividadesList from "@/components/ordens/subatividades/CustomSubatividadesList";
import CustomSubatividadesForm from "@/components/ordens/subatividades/CustomSubatividadesForm";

interface ServicoSubatividadesProps {
  tipoServico: TipoServico;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  disabled?: boolean;
}

export function ServicoSubatividades({ 
  tipoServico,
  subatividades,
  onChange,
  disabled = false
}: ServicoSubatividadesProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updatedSubatividades = [...subatividades];
    updatedSubatividades[index] = { 
      ...updatedSubatividades[index],
      selecionada: checked 
    };
    onChange(updatedSubatividades);
  };

  const handleCustomSubatividadeAdd = (nome: string) => {
    const novaSubatividade: SubAtividade = {
      id: `custom-${Date.now()}`,
      nome,
      selecionada: true
    };
    onChange([...subatividades, novaSubatividade]);
    setShowAddForm(false);
  };

  const handleCustomSubatividadeRemove = (id: string) => {
    const updatedSubatividades = subatividades.filter(s => s.id !== id);
    onChange(updatedSubatividades);
  };
  
  // Separar subatividades padrão das personalizadas
  const standardSubatividades = subatividades.filter(s => !s.id.startsWith('custom-'));
  const customSubatividades = subatividades.filter(s => s.id.startsWith('custom-'));

  return (
    <div className="ml-6 mt-2">
      <div className="font-medium mb-2 text-sm">Subatividades</div>
      
      {/* Lista de subatividades padrão */}
      <div className="space-y-2 mb-4">
        {standardSubatividades.map((subatividade, index) => (
          <div key={subatividade.id} className="flex items-center space-x-2">
            <Checkbox
              id={`check-${tipoServico}-${subatividade.id}`}
              checked={subatividade.selecionada}
              onCheckedChange={(checked) => handleCheckboxChange(
                subatividades.findIndex(s => s.id === subatividade.id),
                Boolean(checked)
              )}
              disabled={disabled}
            />
            <label
              htmlFor={`check-${tipoServico}-${subatividade.id}`}
              className="text-sm font-normal cursor-pointer select-none"
            >
              {subatividade.nome}
            </label>
          </div>
        ))}
      </div>

      {/* Lista de subatividades personalizadas */}
      {customSubatividades.length > 0 && (
        <CustomSubatividadesList 
          subatividades={customSubatividades}
          onRemove={handleCustomSubatividadeRemove}
          onToggle={(id, checked) => {
            const index = subatividades.findIndex(s => s.id === id);
            if (index !== -1) {
              handleCheckboxChange(index, checked);
            }
          }}
          disabled={disabled}
        />
      )}
      
      {/* Formulário para adicionar subatividades personalizadas */}
      {showAddForm ? (
        <CustomSubatividadesForm
          onAdd={handleCustomSubatividadeAdd}
          onCancel={() => setShowAddForm(false)}
          disabled={disabled}
        />
      ) : (
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          onClick={() => setShowAddForm(true)}
          className="mt-2"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" /> 
          Adicionar subatividade personalizada
        </Button>
      )}
    </div>
  );
}
