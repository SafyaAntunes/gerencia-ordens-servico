
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { SubAtividade } from "@/types/ordens";

interface SubatividadesFormProps {
  initialData?: SubAtividade | null;
  onSave: (data: SubAtividade) => void;
  onCancel?: () => void;
}

const SubatividadesForm: React.FC<SubatividadesFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [nome, setNome] = React.useState(initialData?.nome || "");
  const [descricao, setDescricao] = React.useState(initialData?.descricao || "");
  const [tempoEstimado, setTempoEstimado] = React.useState(
    initialData?.tempoEstimado?.toString() || "1.0"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Nome da subatividade é obrigatório");
      return;
    }

    const subatividade: SubAtividade = {
      id: initialData?.id || uuidv4(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      selecionada: initialData?.selecionada ?? true,
      concluida: initialData?.concluida ?? false,
      tempoEstimado: parseFloat(tempoEstimado) || 0,
      servicoTipo: initialData?.servicoTipo || null,
    };

    onSave(subatividade);
    
    // Resetar formulário se não for edição
    if (!initialData) {
      setNome("");
      setDescricao("");
      setTempoEstimado("1.0");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da Subatividade</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Lavagem química"
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição adicional"
        />
      </div>

      <div>
        <Label htmlFor="tempoEstimado">Tempo Estimado (horas)</Label>
        <Input
          id="tempoEstimado"
          type="number"
          step="0.5"
          min="0"
          value={tempoEstimado}
          onChange={(e) => setTempoEstimado(e.target.value)}
          placeholder="1.0"
        />
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">
          {initialData ? "Atualizar" : "Adicionar"} Subatividade
        </Button>
      </div>
    </form>
  );
};

export default SubatividadesForm;
