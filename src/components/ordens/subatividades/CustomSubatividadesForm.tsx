
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

interface CustomSubatividadesFormProps {
  onAdd: (nome: string) => void;
  onCancel: () => void;
  disabled: boolean;
}

export function CustomSubatividadesForm({
  onAdd,
  onCancel,
  disabled
}: CustomSubatividadesFormProps) {
  const [customSubatividade, setCustomSubatividade] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSubatividade.trim()) {
      e.preventDefault();
      onAdd(customSubatividade.trim());
      setCustomSubatividade("");
    }
  };

  const handleAdd = () => {
    if (customSubatividade.trim()) {
      onAdd(customSubatividade.trim());
      setCustomSubatividade("");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={customSubatividade}
        onChange={(e) => setCustomSubatividade(e.target.value)}
        placeholder="Nome da subatividade"
        className="flex-1"
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoFocus
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled || !customSubatividade.trim()}
      >
        Adicionar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={disabled}
      >
        Cancelar
      </Button>
    </div>
  );
}
