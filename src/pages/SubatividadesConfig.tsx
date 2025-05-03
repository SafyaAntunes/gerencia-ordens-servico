
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Layout from "@/components/layout/Layout";
import { SubatividadeForm } from "@/components/subatividades/SubatividadeForm";
import { SubatividadeList } from "@/components/subatividades/SubatividadeList";
import { TipoServico, SubAtividade, TipoAtividade } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
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
import { getSubatividades, saveSubatividades } from "@/services/subatividadeService";

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
        
        // Garantir que cada subatividade tenha um servicoTipo definido
        const subatividadesComTipo = subatividades.map(s => ({
          ...s,
          // Usar o selectedServicoTipo ou manter o atual se já estiver definido
          servicoTipo: s.servicoTipo || (selectedServicoTipo as TipoServico)
        }));
        
        novoMap[tipoAtividade] = [...outrasSubatividades, ...subatividadesComTipo];
      } else {
        // Garantir que nenhuma subatividade tenha servicoTipo undefined
        const subatividadesProcessadas = subatividades.map(s => ({
          ...s,
          // Se não estiver em modo porServico, podemos definir como null
          servicoTipo: s.servicoTipo || null
        }));
        
        novoMap[selectedTipo] = subatividadesProcessadas;
      }
      
      await saveSubatividades(novoMap);
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
    
    toast.success("Subatividade removida da lista");
  };

  const handleCancelEdit = () => {
    setEditingSubatividade(null);
  };

  const handleSaveSubatividade = (data: SubAtividade) => {
    // Garantir que servicoTipo não seja undefined
    const processedData = {
      ...data,
      servicoTipo: porServico ? selectedServicoTipo as TipoServico : data.servicoTipo || null
    };
    
    if (editingSubatividade) {
      setSubatividades(prev =>
        prev.map(sub => (sub.id === processedData.id ? processedData : sub))
      );
      setEditingSubatividade(null);
      toast.success(`Subatividade "${processedData.nome}" atualizada com sucesso`);
    } else {
      setSubatividades(prev => [...prev, processedData]);
      toast.success(`Subatividade "${processedData.nome}" adicionada com sucesso`);
    }
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
                    Nenhuma subatividade configurada. Adicione uma nova.
                  </p>
                ) : (
                  <SubatividadeList
                    subatividades={subatividades}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={false}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return <Layout onLogout={onLogout}>{content}</Layout>;
}
