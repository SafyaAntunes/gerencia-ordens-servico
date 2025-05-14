
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileX } from "lucide-react";

interface NotFoundOrdemProps {
  id?: string;
}

export function NotFoundOrdem({ id }: NotFoundOrdemProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <FileX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Ordem não encontrada</h2>
        <p className="text-gray-500 mb-6">
          {id ? `A ordem de serviço ${id} não existe ou foi removida` : 'A ordem de serviço que você está procurando não existe ou foi removida'}
        </p>
        <Button 
          onClick={() => navigate("/ordens")}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Voltar para listagem
        </Button>
      </div>
    </div>
  );
}
