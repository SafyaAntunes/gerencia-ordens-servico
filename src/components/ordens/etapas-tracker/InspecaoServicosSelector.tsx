
import { TipoServico, EtapaOS } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { tipoServicoLabel } from "@/utils/etapaNomes"; 
import { useState, useEffect } from "react";

interface InspecaoServicosSelectorProps {
  servicosTipo: TipoServico[];
  selectedServicoTipo?: TipoServico;
  onSelect?: (tipo: TipoServico) => void;
  onServicoTipoSelect?: (tipo: TipoServico) => void;
  etapa: "inspecao_inicial" | "inspecao_final";
}

export default function InspecaoServicosSelector({
  servicosTipo,
  selectedServicoTipo,
  onSelect,
  onServicoTipoSelect,
  etapa
}: InspecaoServicosSelectorProps) {
  const [selectedType, setSelectedType] = useState<TipoServico | undefined>(selectedServicoTipo);
  
  // Atualizar o estado interno quando a prop mudar
  useEffect(() => {
    if (selectedServicoTipo !== selectedType) {
      setSelectedType(selectedServicoTipo);
    }
  }, [selectedServicoTipo]);
  
  const handleSelect = (tipo: TipoServico) => {
    console.log(`InspecaoServicosSelector - Serviço selecionado: ${tipo}`);
    setSelectedType(tipo);
    
    // Chamar o callback apropriado
    if (onSelect) {
      onSelect(tipo);
    } else if (onServicoTipoSelect) {
      onServicoTipoSelect(tipo);
    }
  };

  const etapaNome = etapa === "inspecao_inicial" ? "Inspeção Inicial" : "Inspeção Final";
  
  // MODIFICADO: Filtrar serviços para inspeção
  // Se a etapa for inspeção inicial ou final, incluir os serviços principais mais o próprio serviço de inspeção
  const servicosValidos = etapa === "inspecao_inicial" || etapa === "inspecao_final"
    ? servicosTipo.filter(tipo => 
        // Incluir o próprio tipo de inspeção na lista de serviços válidos
        tipo === etapa || 
        // E também incluir os serviços regulares (excluindo lavagem e outros tipos de inspeção)
        (tipo !== "lavagem" && 
         tipo !== "inspecao_inicial" && 
         tipo !== "inspecao_final"))
    : servicosTipo.filter(tipo => 
        tipo !== "lavagem" && 
        tipo !== "inspecao_inicial" && 
        tipo !== "inspecao_final");
  
  console.log(`InspecaoServicosSelector - Serviços disponíveis para ${etapa}:`, servicosValidos);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{etapaNome} - Selecione um serviço</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha o tipo de serviço que você deseja inspecionar
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {servicosValidos.map((tipo) => (
          <Button
            key={tipo}
            variant={selectedType === tipo ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect(tipo)}
            className="justify-start"
          >
            {tipoServicoLabel[tipo] || tipo}
          </Button>
        ))}
      </div>
      
      {servicosValidos.length === 0 && (
        <div className="p-4 border rounded text-center text-muted-foreground">
          Nenhum serviço disponível para inspeção
        </div>
      )}
    </div>
  );
}
