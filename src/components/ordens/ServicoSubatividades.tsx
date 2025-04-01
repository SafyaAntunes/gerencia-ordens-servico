
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form";
import { TipoServico, SubAtividade } from "@/types/ordens";

// Define all subatividades for each tipo de serviço
const SUBATIVIDADES: Record<TipoServico, string[]> = {
  bloco: [
    'RETÍFICA DE CILINDRO',
    'ENCAMISAR',
    'BRUNIR',
    'RETIFICAR MANCAL',
    'LAVAGEM QUÍMICA',
    'RETIFICA DE FAZE',
    'SERVIÇO DE SOLDA',
    'MEDIR MANCAL',
    'EXTRAIR PRISIONEIRO',
    'RETÍFICA DE ROSCA'
  ],
  cabecote: [
    'DESCARBONIZAR',
    'SERVIÇO DE SOLDA',
    'RETÍFICA FACE',
    'MUDAR GUIA',
    'MUDAR SEDE',
    'RETÍFICA DE SEDE',
    'RETÍFICA DE VÁLVULAS',
    'ESMERILHAR',
    'CALIBRAR VÁLVULAS',
    'DESMONTAR',
    'MONTAR VÁLVULAR',
    'FACE LATERAL',
    'EXTRAIR PRISIONEIRO',
    'RECUPERAR ROSCA',
    'RETÍFICA MANCAL DE COMANDO',
    'TESTE DE TRINCA',
    'TESTADO',
    'TESTAR MOLAS'
  ],
  virabrequim: [
    'RETÍFICA BB-BC',
    'POLIR',
    'DESEMPENAR',
    'TESTE DE TRINCA'
  ],
  eixo_comando: [
    'RETIFICAR',
    'POLIR'
  ],
  biela: [
    'RETIFICA BUCHA DE BIELA',
    'RETIFICA DE AÇO DE BIELA',
    'MUDAR PISTÃO',
    'MEDIR AÇO DE BIELA'
  ],
  montagem: [
    'TOTAL',
    'PARCIAL',
    'IN-LOCO'
  ]
};

interface ServicoSubatividadesProps {
  tipo: TipoServico;
  subatividades: SubAtividade[];
  onSubatividadesChange: (subatividades: SubAtividade[]) => void;
}

export default function ServicoSubatividades({
  tipo,
  subatividades,
  onSubatividadesChange
}: ServicoSubatividadesProps) {
  const handleSubatividadeChange = (subatividadeId: string, checked: boolean) => {
    const novasSubatividades = subatividades.map(sub => {
      if (sub.id === subatividadeId) {
        return { ...sub, selecionada: checked };
      }
      return sub;
    });
    
    onSubatividadesChange(novasSubatividades);
  };

  return (
    <div className="ml-6 mt-2 space-y-2 border-l-2 pl-4 border-gray-200">
      <h4 className="text-sm font-medium mb-1">Subatividades:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {subatividades.map((subatividade) => (
          <div key={subatividade.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`subatividade-${subatividade.id}`}
              checked={subatividade.selecionada}
              onCheckedChange={(checked) => 
                handleSubatividadeChange(subatividade.id, checked === true)
              }
            />
            <FormLabel 
              htmlFor={`subatividade-${subatividade.id}`}
              className="text-sm text-muted-foreground font-normal cursor-pointer"
            >
              {subatividade.nome}
            </FormLabel>
          </div>
        ))}
      </div>
    </div>
  );
}
