
import React from "react";
import { FormValues } from "@/components/ordens/form/types";
import { OrdemForm } from "@/components/ordens/form/OrdemForm";
import { formatFormDataFromOrdem, formatOrdemFromFormData } from "@/utils/ordemFormFormatter";
import { OrdemServico, SubAtividade } from "@/types/ordens";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface OrdemFormWrapperProps {
  ordem: OrdemServico;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  onSubatividadeToggle?: (tipo: string, subId: string, checked: boolean) => void;
  prepareSubatividadesForEdit?: () => Record<string, SubAtividade[]>;
  clientes?: any[];
  isLoadingClientes?: boolean;
}

export const OrdemFormWrapper: React.FC<OrdemFormWrapperProps> = ({
  ordem,
  onSubmit,
  onCancel,
  isSubmitting,
  clientes = [],
  isLoadingClientes = false
}) => {
  // Formatar dados da ordem para o formato do formulário
  const formDataInicial = formatFormDataFromOrdem(ordem);
  
  const handleSubmit = async (formData: FormValues & { 
    servicosDescricoes: Record<string, string>,
    fotosEntrada?: any[],
    fotosSaida?: any[]
  }) => {
    try {
      // Formatar dados do formulário para o formato da ordem
      const ordemAtualizada = formatOrdemFromFormData(formData, ordem);
      
      // Preservar as subatividades existentes
      ordemAtualizada.servicos = ordemAtualizada.servicos.map((novoServico) => {
        const servicoExistente = ordem.servicos.find(s => s.tipo === novoServico.tipo);
        
        if (servicoExistente && servicoExistente.subatividades) {
          return {
            ...novoServico,
            subatividades: servicoExistente.subatividades
          };
        }
        
        return novoServico;
      });
      
      // Chamar a função onSubmit com os dados atualizados
      onSubmit(ordemAtualizada);
    } catch (error) {
      console.error("Erro ao processar dados do formulário:", error);
      toast.error("Erro ao processar dados do formulário");
    }
  };

  return (
    <OrdemForm
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
      defaultValues={formDataInicial}
      defaultFotosEntrada={ordem.fotosEntrada || []}
      defaultFotosSaida={ordem.fotosSaida || []}
      onCancel={onCancel}
      clientes={clientes}
      isLoadingClientes={isLoadingClientes}
    />
  );
};
