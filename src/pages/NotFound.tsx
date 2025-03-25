
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: Usuário tentou acessar rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
        <FileX className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Oops! Página não encontrada
        </p>
        <p className="text-sm text-gray-500 mb-6">
          O recurso que você está tentando acessar não existe ou foi removido.
          Verifique o URL e tente novamente.
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Ir para a Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
