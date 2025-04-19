import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Layout from "@/components/layout/Layout";
import { SubatividadeForm } from "@/components/subatividades/SubatividadeForm";
import { SubatividadeList } from "@/components/subatividades/SubatividadeList";
import { TipoServico, SubAtividade, TipoAtividade, EtapaOS } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { getSubatividades, saveSubatividade } from "@/services/subatividadeService";
import { Input } from "@/components/ui/input";

interface SubatividadesConfigProps {
  onLogout?: () => void;
  isEmbedded?: boolean;
  tipoFixo?: TipoAtividade | TipoServico;
  titulo?: string;
  descricao?: string;
  porServico?: boolean;
}

export default function SubatividadesConfig({ 
  onLogout, 
  isEmbedded = false,
  tipoFixo,
  titulo = "Configuração de Subatividades",
  descricao = "Gerencie as subatividades para cada tipo de serviço",
  porServico = false 
}: SubatividadesConfigProps) {
  const navigate = useNavigate();
  const [selectedTipo, setSelectedTipo] = useState<TipoServico | TipoAtividade | string>(
    tipoFixo || "bloco"
  );
  const [selectedServicoTipo, setSelectedServicoTipo] = useState<TipoServico | string>(
    porServico ? "bloco" : ""
  );
  const [subatividades, setSubatividades] = useState<SubAtividade[]>([]);
  const [subatividadesMap, setSubatividadesMap] = useState<Record<string, SubAtividade[]>>({});
  const [editingSubatividade, setEditingSubatividade] = useState<SubAtividade | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { defaultSubatividades, defaultAtividadesEspecificas } = useServicoSubatividades();
  const [etapasTempoPreco, setEtapasTempoPreco] = useState<Record<EtapaOS, {
    precoHora?: number;
    tempoEstimado?: number;
    configuracoesServico?: Record<TipoServico, { precoHora: number; tempoEstimado: number; }>;
  }>>({
    lavagem: { precoHora: 0, tempoEstimado: 0 },
    inspecao_inicial: { precoHora: 0, tempoEstimado: 0 },
    inspecao_final: { precoHora: 0, tempoEstimado: 0 },
    retifica: { precoHora: 0, tempoEstimado: 0 },
    montagem: { precoHora: 0, tempoEstimado: 0 },
    dinamometro: { precoHora: 0, tempoEstimado: 0 }
  });

  const tiposServico: { value: string; label: string }[] = [
    { value: "bloco", label: "Bloco" },
    { value: "biela", label: "Biela" },
    { value: "cabecote", label: "Cabeçote" },
    { value: "virabrequim", label: "Virabrequim" },
    { value: "eixo_comando", label: "Eixo de Comando" },
    { value: "montagem", label: "Montagem" },
    { value: "dinamometro", label: "Dinamômetro" },
    { value: "lavagem", label: "Lavagem" },
  ];

  const tiposAtividade: { value: string; label: string }[] = [
    { value: "lavagem", label: "Lavagem" },
    { value: "inspecao_inicial", label: "Inspeção Inicial" },
    { value: "inspecao_final", label: "Inspeção Final" }
  ];

  useEffect(() => {
    const fetchSubatividades = async () => {
      setIsLoading(true);
      try {
        const data = await getSubatividades();
        setSubatividadesMap(data);
        
        if (porServico && tipoFixo && selectedServicoTipo) {
          const tipoAtividade = tipoFixo as TipoAtividade;
          const servicoTipo = selectedServicoTipo as TipoServico;
          
          const filtradas = data[tipoAtividade]?.filter(
            s => !s.servicoTipo || s.servicoTipo === servicoTipo
          ) || [];
          
          setSubatividades(filtradas);
          
          if (filtradas.length === 0 && defaultAtividadesEspecificas[tipoAtividade]?.[servicoTipo]) {
            const defaults = defaultAtividadesEspecificas[tipoAtividade][servicoTipo].map(nome => ({
              id: uuidv4(),
              nome,
              selecionada: false,
              precoHora: 70,
              servicoTipo
            }));
            
            setSubatividades(defaults);
          }
        } else if (selectedTipo) {
          setSubatividades(data[selectedTipo as string] || []);
        }
      } catch (error) {
        console.error("Erro ao carregar subatividades:", error);
        toast.error("Erro ao carregar subatividades");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubatividades();
  }, [selectedTipo, selectedServicoTipo, tipoFixo, porServico]);

  const handleTipoChange = (value: string) => {
    setSelectedTipo(value);
    setEditingSubatividade(null);
  };

  const handleServicoTipoChange = (value: string) => {
    setSelectedServicoTipo(value as TipoServico);
    setEditingSubatividade(null);
  };

  const handleAddDefault = () => {
    let defaultsToAdd: string[] = [];
    
    if (porServico && tipoFixo && selectedServicoTipo) {
      const tipoAtividade = tipoFixo as TipoAtividade;
      const servicoTipo = selectedServicoTipo as TipoServico;
      
      defaultsToAdd = defaultAtividadesEspecificas[tipoAtividade]?.[servicoTipo] || [];
    } else {
      defaultsToAdd = defaultSubatividades[selectedTipo as TipoServico] || [];
    }
    
    const novosDefault = defaultsToAdd
      .filter(nome => !subatividades.some(s => s.nome.toLowerCase() === nome.toLowerCase()))
      .map(nome => ({
        id: uuidv4(),
        nome,
        selecionada: false,
        precoHora: 70,
        servicoTipo: porServico ? selectedServicoTipo as TipoServico : undefined
      }));
    
    if (novosDefault.length > 0) {
      setSubatividades(prev => [...prev, ...novosDefault]);
      toast.success(`${novosDefault.length} subatividades padrão adicionadas`);
    } else {
      toast.info("Todas as subatividades padrão já estão na lista");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const novoMap = { ...subatividadesMap };
      
      if (porServico && tipoFixo) {
        const tipoAtividade = tipoFixo as TipoAtividade;
        
        const existentes = novoMap[tipoAtividade] || [];
        const outrasSubatividades = existentes.filter(
          s => s.servicoTipo !== selectedServicoTipo
        );
        
        const subatividadesComTipo = subatividades.map(s => ({
          ...s,
          servicoTipo: selectedServicoTipo as TipoServico
        }));
        
        novoMap[tipoAtividade] = [...outrasSubatividades, ...subatividadesComTipo];
      } else {
        novoMap[selectedTipo] = subatividades;
      }
      
      for (const tipo in novoMap) {
        const subatividades = novoMap[tipo as TipoServico | TipoAtividade];
        for (const sub of subatividades) {
          await saveSubatividade(sub, tipo as TipoServico | TipoAtividade);
        }
      }
      
      toast.success("Subatividades salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar subatividades:", error);
      toast.error("Erro ao salvar subatividades");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (sub: SubAtividade) => {
    setEditingSubatividade(sub);
  };

  const handleDelete = (id: string) => {
    setSubatividades(prev => prev.filter(sub => sub.id !== id));
    
    if (editingSubatividade?.id === id) {
      setEditingSubatividade(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubatividade(null);
  };

  const handleSaveSubatividade = (data: SubAtividade) => {
    if (editingSubatividade) {
      setSubatividades(prev =>
        prev.map(sub => (sub.id === data.id ? data : sub))
      );
      setEditingSubatividade(null);
    } else {
      setSubatividades(prev => [...prev, {
        ...data,
        servicoTipo: porServico ? selectedServicoTipo as TipoServico : undefined
      }]);
    }
  };

  const handleEtapaTempoPrecoChange = (
    etapa: EtapaOS, 
    field: 'precoHora' | 'tempoEstimado', 
    value: number,
    servicoTipo?: TipoServico
  ) => {
    setEtapasTempoPreco(prev => {
      const newState = { ...prev };
      
      if (servicoTipo) {
        // Se um tipo de serviço específico foi fornecido, atualize a configuração específica
        if (!newState[etapa].configuracoesServico) {
          newState[etapa].configuracoesServico = {};
        }
        if (!newState[etapa].configuracoesServico[servicoTipo]) {
          newState[etapa].configuracoesServico[servicoTipo] = {
            precoHora: 0,
            tempoEstimado: 0
          };
        }
        newState[etapa].configuracoesServico[servicoTipo][field] = value;
      } else {
        // Caso contrário, atualize o valor padrão
        if (!newState[etapa]) {
          newState[etapa] = {};
        }
        newState[etapa][field] = value;
      }
      
      return newState;
    });
  };

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!tipoFixo && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Serviço
                </label>
                <Select 
                  value={selectedTipo as string} 
                  onValueChange={handleTipoChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposServico.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {porServico && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Serviço
                </label>
                <Select 
                  value={selectedServicoTipo as string} 
                  onValueChange={handleServicoTipoChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposServico.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddDefault}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Padrões
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSave}
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Salvar Alterações
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="md:col-span-1">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">
                    {editingSubatividade ? "Editar Subatividade" : "Nova Subatividade"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubatividadeForm
                    onSave={handleSaveSubatividade}
                    tipoServico={
                      porServico 
                        ? selectedServicoTipo as TipoServico 
                        : (tipoFixo || selectedTipo) as TipoServico | TipoAtividade
                    }
                    initialData={editingSubatividade}
                    onCancel={handleCancelEdit}
                  />
                </CardContent>
              </Card>
              
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold mb-4">Subatividades</h3>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subatividades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma subatividade configurada. Adicione uma nova ou use o botão "Adicionar Padrões".
                  </p>
                ) : (
                  <SubatividadeList
                    subatividades={subatividades}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ETAPAS_CONFIG = {
    lavagem: {
      icon: <Clock className="h-5 w-5 mr-2" />,
      label: "Lavagem"
    },
    inspecao_inicial: {
      icon: <Clock className="h-5 w-5 mr-2" />,
      label: "Inspeção Inicial"
    },
    inspecao_final: {
      icon: <Clock className="h-5 w-5 mr-2" />,
      label: "Inspeção Final"
    }
  };

  const temposValoresContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Tempos e Valores das Etapas
        </CardTitle>
        <CardDescription>
          Configure os valores padrão e específicos por tipo de serviço para cada etapa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Carregando configurações de etapas...</span>
          </div>
        ) : (
          <>
            {(['lavagem', 'inspecao_inicial', 'inspecao_final'] as const).map((etapa) => (
              <div key={etapa} className="border rounded-md p-4">
                <div className="flex items-center mb-3">
                  {ETAPAS_CONFIG[etapa].icon}
                  <h3 className="text-lg font-semibold">{ETAPAS_CONFIG[etapa].label}</h3>
                </div>
                
                {/* Configurações Padrão */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Configuração Padrão</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Valor por hora (R$)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        min={0}
                        step={0.01}
                        value={etapasTempoPreco[etapa]?.precoHora || 0}
                        onChange={(e) => handleEtapaTempoPrecoChange(
                          etapa, 
                          'precoHora', 
                          parseFloat(e.target.value) || 0
                        )}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tempo estimado (horas)</label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        min={0}
                        step={0.5}
                        value={etapasTempoPreco[etapa]?.tempoEstimado || 0}
                        onChange={(e) => handleEtapaTempoPrecoChange(
                          etapa, 
                          'tempoEstimado', 
                          parseFloat(e.target.value) || 0
                        )}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Configurações por Tipo de Serviço */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Configurações Específicas por Tipo de Serviço</h4>
                  <div className="space-y-4">
                    {tiposServico.map((tipo) => (
                      <div key={tipo.value} className="border-t pt-4">
                        <h5 className="text-sm font-medium mb-2">{tipo.label}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Valor por hora (R$)</label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              min={0}
                              step={0.01}
                              value={
                                etapasTempoPreco[etapa]?.configuracoesServico?.[tipo.value]?.precoHora || 
                                etapasTempoPreco[etapa]?.precoHora || 
                                0
                              }
                              onChange={(e) => handleEtapaTempoPrecoChange(
                                etapa,
                                'precoHora',
                                parseFloat(e.target.value) || 0,
                                tipo.value as TipoServico
                              )}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Tempo estimado (horas)</label>
                            <Input
                              type="number"
                              placeholder="0.0"
                              min={0}
                              step={0.5}
                              value={
                                etapasTempoPreco[etapa]?.configuracoesServico?.[tipo.value]?.tempoEstimado || 
                                etapasTempoPreco[etapa]?.tempoEstimado || 
                                0
                              }
                              onChange={(e) => handleEtapaTempoPrecoChange(
                                etapa,
                                'tempoEstimado',
                                parseFloat(e.target.value) || 0,
                                tipo.value as TipoServico
                              )}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (isEmbedded) {
    return content;
  }

  return <Layout onLogout={onLogout}>{temposValoresContent}</Layout>;
}
