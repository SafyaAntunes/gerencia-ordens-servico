
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipoServico, SubAtividade } from "@/types/ordens";
import { Edit, Plus, Trash2 } from "lucide-react";

// Helper function to format text to title case
const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface ServicoSubatividadesProps {
  tipo: TipoServico;
  subatividades: SubAtividade[];
  onSubatividadesChange: (subatividades: SubAtividade[]) => void;
}

export default function ServicoSubatividades({
  tipo,
  subatividades,
  onSubatividadesChange
}: ServicoSubatividadesProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newSubatividadeText, setNewSubatividadeText] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSubatividadeChange = (subatividadeId: string, checked: boolean) => {
    const novasSubatividades = subatividades.map(sub => {
      if (sub.id === subatividadeId) {
        return { ...sub, selecionada: checked };
      }
      return sub;
    });
    
    onSubatividadesChange(novasSubatividades);
  };

  const handleEditClick = (subatividade: SubAtividade) => {
    setIsEditing(subatividade.id);
    setEditText(subatividade.nome);
  };

  const handleEditSave = (subatividadeId: string) => {
    if (editText.trim()) {
      const novasSubatividades = subatividades.map(sub => {
        if (sub.id === subatividadeId) {
          return { ...sub, nome: toTitleCase(editText.trim()) };
        }
        return sub;
      });
      
      onSubatividadesChange(novasSubatividades);
    }
    setIsEditing(null);
    setEditText("");
  };

  const handleDeleteSubatividade = (subatividadeId: string) => {
    const novasSubatividades = subatividades.filter(sub => sub.id !== subatividadeId);
    onSubatividadesChange(novasSubatividades);
  };

  const handleAddNewSubatividade = () => {
    if (newSubatividadeText.trim()) {
      const newSubatividade: SubAtividade = {
        id: `${Date.now()}`,
        nome: toTitleCase(newSubatividadeText.trim()),
        selecionada: true
      };
      
      onSubatividadesChange([...subatividades, newSubatividade]);
      setNewSubatividadeText("");
      setIsAddingNew(false);
    }
  };

  return (
    <div className="ml-6 mt-2 space-y-2 border-l-2 pl-4 border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Subatividades:</h4>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setIsAddingNew(true)}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar
        </Button>
      </div>
      
      {isAddingNew && (
        <div className="flex items-center gap-2 mb-3">
          <Input
            size={1}
            placeholder="Nova subatividade"
            value={newSubatividadeText}
            onChange={(e) => setNewSubatividadeText(e.target.value)}
            className="h-8 text-sm"
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={handleAddNewSubatividade}
            className="h-8"
          >
            Salvar
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsAddingNew(false);
              setNewSubatividadeText("");
            }}
            className="h-8"
          >
            Cancelar
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {subatividades.map((subatividade) => (
          <div key={subatividade.id} className="flex items-center space-x-2 group">
            {isEditing === subatividade.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  size={1}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => handleEditSave(subatividade.id)}
                  className="h-8"
                >
                  Salvar
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(null)}
                  className="h-8"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <Checkbox 
                  id={`subatividade-${subatividade.id}`}
                  checked={subatividade.selecionada}
                  onCheckedChange={(checked) => 
                    handleSubatividadeChange(subatividade.id, checked === true)
                  }
                />
                <FormLabel 
                  htmlFor={`subatividade-${subatividade.id}`}
                  className="text-sm text-muted-foreground font-normal cursor-pointer flex-1"
                >
                  {toTitleCase(subatividade.nome)}
                </FormLabel>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEditClick(subatividade)}
                    className="h-7 w-7"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteSubatividade(subatividade.id)}
                    className="h-7 w-7 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
