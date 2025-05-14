
import { EtapaOS } from "@/types/ordens";
import { etapaNomeFormatado } from "@/utils/etapaNomes";

interface EmptyServicesProps {
  etapa: EtapaOS;
}

export function EmptyServices({ etapa }: EmptyServicesProps) {
  const etapaNome = etapaNomeFormatado[etapa] || etapa;
  
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-medium mb-2">Sem serviços para {etapaNome}</h3>
      <p className="text-sm text-muted-foreground">
        Não há serviços cadastrados para esta etapa. Adicione serviços na edição da ordem.
      </p>
    </div>
  );
}
