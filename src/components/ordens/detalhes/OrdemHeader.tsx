
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrdemHeaderProps {
  id: string;
  nome: string;
  canEdit: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function OrdemHeader({ id, nome, canEdit, onEditClick, onDeleteClick }: OrdemHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/ordens")}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para listagem
      </Button>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          OS #{id.slice(-5)} - {nome}
        </h1>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button 
                variant="outline" 
                onClick={onEditClick}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="destructive" 
                onClick={onDeleteClick}
              >
                <Trash className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
