
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TipoServico, SubAtividade, TipoAtividade } from "@/types/ordens";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { v4 as uuidv4 } from "uuid";
import { getSubatividades } from "@/services/subatividadeService";
import ServicoAtividadesConfig from "./ServicoAtividadesConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AtividadesConfigFormProps {
  servicosTipos: TipoServico[];
  atividadesEspecificas: Record<TipoServico, Record<TipoAtividade, SubAtividade[]>>;
  onChangeAtividadesEspecificas: (
    atividadesEspecificas: Record<TipoServico, Record<TipoAtividade, SubAtividade[]>>
  ) => void;
}

export default function AtividadesConfigForm({
  servicosTipos,
  atividadesEspecificas,
  onChangeAtividadesEspecificas
}: AtividadesConfigFormProps) {
  const [activeTab, setActiveTab] = useState<TipoAtividade>("lavagem");
  const [isLoading, setIsLoading] = useState(true);
  const [tiposAtividade] = useState<TipoAtividade[]>(["lavagem", "inspecao_inicial", "inspecao_final"]);
  const { defaultAtividadesEspecificas } = useServicoSubatividades();
  
  useEffect(() => {
    const fetchAtividadesConfig = async () => {
      setIsLoading(true);
      try {
        const atividadesData = await getSubatividades();
        const novasAtividadesEspecificas = { ...atividadesEspecificas };
        
        // Para cada serviço selecionado
        servicosTipos.forEach(servicoTipo => {
          // Verificar se já existe configuração para este serviço
          if (!novasAtividadesEspecificas[servicoTipo]) {
            novasAtividadesEspecificas[servicoTipo] = {};
          }
          
          // Para cada tipo de atividade
          tiposAtividade.forEach(tipoAtividade => {
            // Verificar se já existe configuração para este tipo de atividade neste serviço
            if (!novasAtividadesEspecificas[servicoTipo][tipoAtividade]) {
              // Buscar subatividades cadastradas para este tipo de atividade
              let subatividades: SubAtividade[] = [];
              
              if (atividadesData[tipoAtividade]) {
                // Filtrar apenas as subatividades que têm servicoTipo igual ao atual
                // ou que não têm servicoTipo definido (compatível com todos)
                subatividades = atividadesData[tipoAtividade]
                  .filter(sub => !sub.servicoTipo || sub.servicoTipo === servicoTipo)
                  .map(sub => ({
                    ...sub,
                    selecionada: false,
                    servicoTipo: servicoTipo
                  }));
              }
              
              // Se não houver subatividades cadastradas, usar as padrões
              if (subatividades.length === 0 && defaultAtividadesEspecificas[tipoAtividade]?.[servicoTipo]) {
                subatividades = defaultAtividadesEspecificas[tipoAtividade][servicoTipo].map(nome => ({
                  id: uuidv4(),
                  nome,
                  selecionada: false,
                  precoHora: atividadesData[tipoAtividade]?.[0]?.precoHora || 0,
                  servicoTipo: servicoTipo
                }));
              }
              
              novasAtividadesEspecificas[servicoTipo][tipoAtividade] = subatividades;
            }
          });
        });
        
        // Limpar serviços que não estão mais selecionados
        Object.keys(novasAtividadesEspecificas).forEach(servicoTipo => {
          if (!servicosTipos.includes(servicoTipo as TipoServico)) {
            delete novasAtividadesEspecificas[servicoTipo as TipoServico];
          }
        });
        
        onChangeAtividadesEspecificas(novasAtividadesEspecificas);
      } catch (error) {
        console.error("Erro ao buscar configurações de atividades:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAtividadesConfig();
  }, [servicosTipos, tiposAtividade]);
  
  const handleSubatividadesChange = (
    servicoTipo: TipoServico,
    tipoAtividade: TipoAtividade,
    subatividades: SubAtividade[]
  ) => {
    const novasAtividadesEspecificas = { ...atividadesEspecificas };
    
    if (!novasAtividadesEspecificas[servicoTipo]) {
      novasAtividadesEspecificas[servicoTipo] = {};
    }
    
    novasAtividadesEspecificas[servicoTipo][tipoAtividade] = subatividades;
    onChangeAtividadesEspecificas(novasAtividadesEspecificas);
  };
  
  const formatTabLabel = (tipo: TipoAtividade): string => {
    switch(tipo) {
      case "lavagem": return "Lavagem";
      case "inspecao_inicial": return "Inspeção Inicial";
      case "inspecao_final": return "Inspeção Final";
      default: return tipo;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Atividades Específicas</CardTitle>
          <CardDescription>
            Carregando atividades...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (servicosTipos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Atividades Específicas</CardTitle>
          <CardDescription>
            Configure atividades específicas para cada serviço
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Selecione pelo menos um serviço na aba anterior para configurar atividades específicas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Atividades Específicas</CardTitle>
        <CardDescription>
          Configure atividades específicas para cada serviço
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="lavagem" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TipoAtividade)}
          className="w-full"
        >
          <TabsList className="mb-4 grid grid-cols-3">
            {tiposAtividade.map((tipo) => (
              <TabsTrigger key={tipo} value={tipo}>
                {formatTabLabel(tipo)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tiposAtividade.map((tipoAtividade) => (
            <TabsContent key={tipoAtividade} value={tipoAtividade} className="space-y-4">
              {servicosTipos.map((servicoTipo) => (
                <ServicoAtividadesConfig
                  key={`${servicoTipo}-${tipoAtividade}`}
                  servicoTipo={servicoTipo}
                  atividadeTipo={tipoAtividade}
                  subatividades={atividadesEspecificas[servicoTipo]?.[tipoAtividade] || []}
                  onChange={(subatividades) => 
                    handleSubatividadesChange(servicoTipo, tipoAtividade, subatividades)
                  }
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
