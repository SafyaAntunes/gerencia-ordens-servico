
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function NotFoundOrdem() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-lg mb-4">Ordem não encontrada</p>
      <Button onClick={() => navigate("/ordens")}>
        Voltar para listagem
      </Button>
    </div>
  );
}
