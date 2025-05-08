
import { useState, useEffect } from "react";
import { TipoServico, SubAtividade, TipoAtividade, Servico } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ServicoAtividadesConfig from "./ServicoAtividadesConfig";
import { getSubatividades } from "@/services/subatividadeService";

interface AtividadesConfigFormProps {
  servicos: Servico[];
  onChange: (servicos: Servico[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AtividadesConfigForm({
  servicos,
  onChange,
  open,
  onOpenChange
}: AtividadesConfigFormProps) {
  const [subatividadesMap, setSubatividadesMap] = useState<Record<TipoAtividade, SubAtividade[]>>({
    lavagem: [],
    inspecao_inicial: [],
    inspecao_final: []
  });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchSubatividades = async () => {
      setIsLoading(true);
      try {
        const data = await getSubatividades();
        
        // Filtrar apenas os tipos de atividade
        const atividadesMap = {
          lavagem: data.lavagem || [],
          inspecao_inicial: data.inspecao_inicial || [],
          inspecao_final: data.inspecao_final || [],
        };
        
        setSubatividadesMap(atividadesMap);
      } catch (error) {
        console.error("Erro ao carregar subatividades:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      fetchSubatividades();
    }
  }, [open]);
  
  // Inicializar as subatividades para cada serviço e tipo de atividade
  useEffect(() => {
    if (Object.keys(subatividadesMap).length === 0) return;
    
    const servicosAtualizados = servicos.map(servico => {
      if (!servico.atividadesRelacionadas) {
        servico.atividadesRelacionadas = {};
      }
      
      // Para cada tipo de atividade (lavagem, inspeção inicial, inspeção final)
      Object.entries(subatividadesMap).forEach(([atividadeTipo, subatividades]) => {
        const tipoAtividade = atividadeTipo as TipoAtividade;
        
        // Filtra subatividades específicas para este tipo de serviço
        const subatividadesDoServico = subatividades.filter(
          s => !s.servicoTipo || s.servicoTipo === servico.tipo
        );
        
        // Se já existem subatividades configuradas, mantém a seleção
        if (servico.atividadesRelacionadas[tipoAtividade]) {
          // Mantém apenas as que ainda existem e adiciona as novas
          const existentes = servico.atividadesRelacionadas[tipoAtividade];
          
          servico.atividadesRelacionadas[tipoAtividade] = subatividadesDoServico.map(sub => {
            const existente = existentes?.find(e => e.id === sub.id);
            return existente ? existente : { ...sub, selecionada: false };
          });
        } else {
          // Inicializa todas como não selecionadas
          servico.atividadesRelacionadas[tipoAtividade] = 
            subatividadesDoServico.map(sub => ({ ...sub, selecionada: false }));
        }
      });
      
      return servico;
    });
    
    onChange(servicosAtualizados);
  }, [subatividadesMap]);
  
  const handleSubatividadesChange = (
    servicoIndex: number, 
    atividadeTipo: TipoAtividade, 
    subatividades: SubAtividade[]
  ) => {
    const servicosAtualizados = [...servicos];
    
    if (!servicosAtualizados[servicoIndex].atividadesRelacionadas) {
      servicosAtualizados[servicoIndex].atividadesRelacionadas = {};
    }
    
    servicosAtualizados[servicoIndex].atividadesRelacionadas[atividadeTipo] = subatividades;
    onChange(servicosAtualizados);
  };
  
  const temConfiguracao = Object.values(subatividadesMap).some(list => list.length > 0);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração de Atividades Específicas</DialogTitle>
          <DialogDescription>
            Configure atividades de lavagem e inspeção específicas para cada serviço
          </DialogDescription>
        </DialogHeader>
        
        {!temConfiguracao && !isLoading && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma subatividade configurada. Configure as subatividades nas configurações do sistema primeiro.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="py-8 text-center">Carregando configurações...</div>
        ) : (
          <div className="space-y-6">
            {servicos.map((servico, servicoIndex) => (
              <div key={servicoIndex} className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {servico.tipo.charAt(0).toUpperCase() + servico.tipo.slice(1)}
                </h3>
                
                {Object.entries(subatividadesMap).map(([atividadeTipo, subatividades]) => {
                  const tipoAtividade = atividadeTipo as TipoAtividade;
                  
                  // Filtra subatividades específicas para este tipo de serviço
                  const subatividadesDoServico = subatividades.filter(
                    s => !s.servicoTipo || s.servicoTipo === servico.tipo
                  );
                  
                  if (subatividadesDoServico.length === 0) return null;
                  
                  return (
                    <ServicoAtividadesConfig
                      key={`${servicoIndex}-${atividadeTipo}`}
                      servicoTipo={servico.tipo}
                      atividadeTipo={tipoAtividade}
                      subatividades={servico.atividadesRelacionadas?.[tipoAtividade] || []}
                      onChange={(subs) => 
                        handleSubatividadesChange(servicoIndex, tipoAtividade, subs)
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
