
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TipoServico, EtapaOS } from "@/types/ordens";
import { formatServicoTipo } from "./EtapasTracker";
import { useNavigate, useParams } from "react-router-dom";

interface InspecaoServicosSelectorProps {
  servicosTipo: TipoServico[];
  etapa: EtapaOS;
}

export function InspecaoServicosSelector({ servicosTipo, etapa }: InspecaoServicosSelectorProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEtapaInicial = etapa === 'inspecao_inicial';

  const handleServicoSelect = (servicoTipo: TipoServico) => {
    // Update the URL with the selected service type
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('etapa', etapa);
    searchParams.set('servico', servicoTipo);
    
    // Navigate to the same page with updated query parameters
    navigate(`/ordens/${id}?${searchParams.toString()}`);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{isEtapaInicial ? 'Inspeção Inicial' : 'Inspeção Final'}</CardTitle>
        <CardDescription>
          Selecione o tipo de serviço para iniciar a {isEtapaInicial ? 'inspeção inicial' : 'inspeção final'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicosTipo.map((tipo) => (
            <Button
              key={tipo}
              variant="outline"
              className="p-6 h-auto flex flex-col items-center justify-center"
              onClick={() => handleServicoSelect(tipo)}
            >
              <span className="text-lg font-medium">{formatServicoTipo(tipo)}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
