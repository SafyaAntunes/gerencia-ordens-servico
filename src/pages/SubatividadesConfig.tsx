
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Layout from "@/components/layout/Layout";
import { SubatividadeForm } from "@/components/subatividades/SubatividadeForm";
import { SubatividadeList } from "@/components/subatividades/SubatividadeList";
import { TipoServico, SubAtividade, TipoAtividade } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2 } from "lucide-react";
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

  // Lista de tipos de serviço ou atividade
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

  // Carregar subatividades do Firebase
  useEffect(() => {
    const fetchSubatividades = async () => {
      setIsLoading(true);
      try {
        const data = await getSubatividades();
        setSubatividadesMap(data);
        
        // Se for uma configuração por serviço (para tipos de atividade)
        if (porServico && tipoFixo && selectedServicoTipo) {
          const tipoAtividade = tipoFixo as TipoAtividade;
          const servicoTipo = selectedServicoTipo as TipoServico;
          
          // Filtrar apenas as subatividades para este tipo de serviço
          const filtradas = data[tipoAtividade]?.filter(
            s => !s.servicoTipo || s.servicoTipo === servicoTipo
          ) || [];
          
          setSubatividades(filtradas);
          
          // Se não houver subatividades, criar a partir dos defaults
          if (filtradas.length === 0 && defaultAtividadesEspecificas[tipoAtividade]?.[servicoTipo]) {
            const defaults = defaultAtividadesEspecificas[tipoAtividade][servicoTipo].map(nome => ({
              id: uuidv4(),
              nome,
              selecionada: false,
              precoHora: 70, // Preço padrão
              servicoTipo
            }));
            
            setSubatividades(defaults);
          }
        } else if (selectedTipo) {
          // Configuração normal (não é por serviço)
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
      // Adicionar defaults para atividades específicas do serviço
      const tipoAtividade = tipoFixo as TipoAtividade;
      const servicoTipo = selectedServicoTipo as TipoServico;
      
      defaultsToAdd = defaultAtividadesEspecificas[tipoAtividade]?.[servicoTipo] || [];
    } else {
      // Adicionar defaults normais
      defaultsToAdd = defaultSubatividades[selectedTipo as TipoServico] || [];
    }
    
    const novosDefault = defaultsToAdd
      .filter(nome => !subatividades.some(s => s.nome.toLowerCase() === nome.toLowerCase()))
      .map(nome => ({
        id: uuidv4(),
        nome,
        selecionada: false,
        precoHora: 70, // Preço padrão
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
        // Salvar por serviço (para tipos de atividade)
        const tipoAtividade = tipoFixo as TipoAtividade;
        
        // Manter subatividades existentes que não são deste serviço
        const existentes = novoMap[tipoAtividade] || [];
        const outrasSubatividades = existentes.filter(
          s => s.servicoTipo !== selectedServicoTipo
        );
        
        // Adicionar as novas subatividades com o tipo de serviço marcado
        const subatividadesComTipo = subatividades.map(s => ({
          ...s,
          servicoTipo: selectedServicoTipo as TipoServico
        }));
        
        novoMap[tipoAtividade] = [...outrasSubatividades, ...subatividadesComTipo];
      } else {
        // Salvamento normal
        novoMap[selectedTipo] = subatividades;
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
  };

  const handleCancelEdit = () => {
    setEditingSubatividade(null);
  };

  const handleSaveSubatividade = (data: SubAtividade) => {
    if (editingSubatividade) {
      // Editando uma existente
      setSubatividades(prev =>
        prev.map(sub => (sub.id === data.id ? data : sub))
      );
      setEditingSubatividade(null);
    } else {
      // Adicionando uma nova
      setSubatividades(prev => [...prev, {
        ...data,
        servicoTipo: porServico ? selectedServicoTipo as TipoServico : undefined
      }]);
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
