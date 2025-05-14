
import { OrdemServico, SubAtividade } from "@/types/ordens";
import OrdemForm from "@/components/ordens/form";
import { Cliente } from "@/types/clientes";

interface OrdemFormWrapperProps {
  ordem: OrdemServico;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubatividadeToggle: (servicoTipo: string, subId: string, checked: boolean) => void;
  prepareSubatividadesForEdit: () => Record<string, SubAtividade[]>;
  clientes: Cliente[];
  isLoadingClientes: boolean;
}

export function OrdemFormWrapper({
  ordem,
  onSubmit,
  isSubmitting,
  onCancel,
  onSubatividadeToggle,
  prepareSubatividadesForEdit,
  clientes,
  isLoadingClientes
}: OrdemFormWrapperProps) {
  return (
    <OrdemForm 
      onSubmit={onSubmit}
      isLoading={isSubmitting}
      defaultValues={{
        id: ordem.id,
        nome: ordem.nome,
        clienteId: ordem.cliente?.id || "",
        motorId: ordem.motorId || "",
        dataAbertura: ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date(),
        dataPrevistaEntrega: ordem.dataPrevistaEntrega ? new Date(ordem.dataPrevistaEntrega) : new Date(),
        prioridade: ordem.prioridade || "media",
        servicosTipos: ordem.servicos?.map(s => s.tipo) || [],
        servicosDescricoes: ordem.servicos?.reduce((acc, s) => {
          acc[s.tipo] = s.descricao;
          return acc;
        }, {} as Record<string, string>) || {},
        // Utilizar a função preparada para obter subatividades com estado preservado
        servicosSubatividades: prepareSubatividadesForEdit()
      }}
      defaultFotosEntrada={ordem?.fotosEntrada || []}
      defaultFotosSaida={ordem?.fotosSaida || []}
      onCancel={onCancel}
      onSubatividadeToggle={onSubatividadeToggle}
      isSubatividadeEditingEnabled={true}
      clientes={clientes}
      isLoadingClientes={isLoadingClientes}
    />
  );
}
