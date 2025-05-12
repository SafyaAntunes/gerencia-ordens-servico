
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EtapaOS } from "@/types/ordens";

interface EmptyServicesProps {
  etapa?: EtapaOS;
}

export function EmptyServices({ etapa }: EmptyServicesProps) {
  const etapaLabel = etapa ? 
    (etapa === 'inspecao_inicial' ? 'Inspeção Inicial' : 
     etapa === 'inspecao_final' ? 'Inspeção Final' : 
     etapa.charAt(0).toUpperCase() + etapa.slice(1)) : 
    'Etapa';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tracker de Serviços</CardTitle>
        <CardDescription>
          Não há serviços com subatividades selecionadas para esta etapa: {etapaLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-6">
          Edite a ordem para selecionar serviços e subatividades.
        </p>
      </CardContent>
    </Card>
  );
}
