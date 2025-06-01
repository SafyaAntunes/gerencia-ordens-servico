
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash, Edit, FileText } from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { generateOrderPDF } from "@/utils/pdfUtils";

interface OrdemHeaderCustomProps {
  id: string;
  nome: string;
  canEdit: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  ordem: OrdemServico;
}

export function OrdemHeaderCustom({ 
  id, 
  nome, 
  canEdit, 
  onEditClick, 
  onDeleteClick,
  ordem 
}: OrdemHeaderCustomProps) {
  const statusLabels: Record<StatusOS, string> = {
    desmontagem: "Desmontagem",
    inspecao_inicial: "Inspeção Inicial",
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    autorizado: "Autorizado",
    executando_servico: "Executando Serviço",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue"
  };

  const formatDateSafely = (date: any): string => {
    if (!date) return "Data não definida";
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!isValid(dateObj)) return "Data inválida";
      
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, date);
      return "Data inválida";
    }
  };

  const handleExportPDF = () => {
    try {
      generateOrderPDF(ordem);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b bg-card">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground">{id}</h1>
        <p className="text-muted-foreground mt-1">
          Criada em {formatDateSafely(ordem.dataAbertura)} • Previsão de entrega: {formatDateSafely(ordem.dataPrevistaEntrega)}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline"
          onClick={handleExportPDF}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
        
        {canEdit && (
          <>
            <Button 
              variant="outline"
              onClick={onEditClick}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            
            <Button 
              variant="destructive"
              onClick={onDeleteClick}
              className="flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Excluir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
