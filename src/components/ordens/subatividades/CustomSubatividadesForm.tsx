
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

interface CustomSubatividadesFormProps {
  customSubatividade: string;
  isAddingCustom: boolean;
  setCustomSubatividade: (value: string) => void;
  setIsAddingCustom: (value: boolean) => void;
  onAddCustom: () => void;
  onAdd: () => void;
  onCancel: () => void;
  disabled: boolean;
}

export function CustomSubatividadesForm({
  customSubatividade,
  isAddingCustom,
  setCustomSubatividade,
  setIsAddingCustom,
  onAddCustom,
  onAdd,
  onCancel,
  disabled,
}: CustomSubatividadesFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSubatividade.trim()) {
      e.preventDefault();
      onAddCustom();
    }
  };

  return (
    <div>
      {isAddingCustom ? (
        <div className="flex items-center gap-2">
          <Input
            value={customSubatividade}
            onChange={(e) => setCustomSubatividade(e.target.value)}
            placeholder="Nome da subatividade"
            className="flex-1"
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd || onAddCustom}
            disabled={!customSubatividade.trim() || disabled}
          >
            Adicionar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel || (() => {
              setCustomSubatividade("");
              setIsAddingCustom(false);
            })}
            disabled={disabled}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setIsAddingCustom(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Subatividade Personalizada
        </Button>
      )}
    </div>
  );
}
