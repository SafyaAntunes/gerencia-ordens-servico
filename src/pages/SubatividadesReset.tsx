
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { deleteAllSubatividades } from "@/services/subatividadeService";
import { toast } from "sonner";

export default function SubatividadesReset() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  const handleReset = async () => {
    if (!confirm("Tem certeza que deseja DELETAR TODAS as subatividades? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteAllSubatividades();
      toast.success("Todas as subatividades foram removidas com sucesso!");
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao resetar subatividades.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resetar Subatividades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção!</AlertTitle>
              <AlertDescription>
                Esta operação irá remover TODAS as subatividades cadastradas no sistema. 
                Use esta função apenas se estiver tendo problemas com subatividades antigas causando conflitos.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="destructive" 
              onClick={handleReset}
              disabled={isDeleting || isDeleted}
            >
              {isDeleting ? "Deletando..." : isDeleted ? "Subatividades Deletadas" : "Resetar Todas Subatividades"}
            </Button>
            
            {isDeleted && (
              <p className="text-sm text-green-600">
                Todas as subatividades foram removidas. Agora você pode ir até a página de 
                "Configurações de Subatividades" e criar novas subatividades do zero.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
