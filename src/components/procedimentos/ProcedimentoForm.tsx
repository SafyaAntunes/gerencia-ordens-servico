
import { useState } from "react";
import { TipoServico } from "@/types/ordens";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { FileText, Save, Edit, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProcedimentoFormProps {
  tipo: TipoServico;
  procedimento?: {
    conteudo?: string;
  };
  isLoading?: boolean;
}

export default function ProcedimentoForm({ tipo, procedimento, isLoading }: ProcedimentoFormProps) {
  const [conteudo, setConteudo] = useState(procedimento?.conteudo || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, "procedimentos", tipo), {
        conteudo,
        ultimaAtualizacao: new Date()
      });
      setIsEditing(false);
      toast.success("Procedimento salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar procedimento:", error);
      toast.error("Erro ao salvar o procedimento");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  // Split content into steps for display
  const steps = conteudo.split('\n').filter(step => step.trim() !== '');

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Procedimento Operacional Padrão:</span>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <Textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite cada passo do procedimento em uma nova linha..."
              className="min-h-[300px] font-mono text-sm"
            />
          ) : (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              {steps.length > 0 ? (
                steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <p className="text-sm pt-1">{step}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Nenhum procedimento cadastrado.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
