
import { useState } from "react";
import { TipoServico } from "@/types/ordens";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { FileText, Save } from "lucide-react";
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, "procedimentos", tipo), {
        conteudo,
        ultimaAtualizacao: new Date()
      });
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileText className="h-4 w-4" />
            <span>Edite o procedimento padrão para este serviço:</span>
          </div>
          
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Digite o procedimento operacional padrão..."
            className="min-h-[300px] font-mono text-sm"
          />
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Procedimento"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
