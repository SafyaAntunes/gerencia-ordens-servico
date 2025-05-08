
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Save, PlusCircle, Trash2, Edit } from "lucide-react";
import { TipoServico, EtapaOS } from "@/types/ordens";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { servicoToEtapaMapping } from "@/components/ordens/servico/hooks/utils/servicoTrackerUtils";
import { useAuth } from "@/hooks/useAuth";

interface ServiceTypeConfigProps {
  onLogout?: () => void;
}

interface ServiceTypeData {
  id: string;
  nome: string;
  etapa: EtapaOS;
  ativo: boolean;
  codigo?: string;
  descricao?: string;
}

export default function ServiceTypesConfig({ onLogout }: ServiceTypeConfigProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceTypeData | null>(null);
  const { funcionario } = useAuth();

  // Form state
  const [formState, setFormState] = useState<{
    nome: string;
    etapa: EtapaOS;
    codigo: string;
    descricao: string;
  }>({
    nome: "",
    etapa: "retifica",
    codigo: "",
    descricao: "",
  });

  const etapasOptions = [
    { value: "retifica", label: "Retífica" },
    { value: "montagem", label: "Montagem" },
    { value: "dinamometro", label: "Dinamômetro" },
    { value: "lavagem", label: "Lavagem" },
    { value: "inspecao_inicial", label: "Inspeção Inicial" },
    { value: "inspecao_final", label: "Inspeção Final" },
  ];

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    setIsLoading(true);
    try {
      // Fetch custom service types from Firestore
      const serviceTypesCollection = collection(db, "tipos_servico");
      const snapshot = await getDocs(serviceTypesCollection);
      
      const customTypes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceTypeData[];
      
      // Add built-in types
      const builtInTypes: ServiceTypeData[] = Object.keys(servicoToEtapaMapping).map(tipo => ({
        id: tipo,
        nome: formatServiceTypeName(tipo as TipoServico),
        etapa: servicoToEtapaMapping[tipo as TipoServico],
        ativo: true,
        codigo: tipo,
        descricao: `Serviço padrão de ${formatServiceTypeName(tipo as TipoServico)}`
      }));
      
      // Combine and deduplicate
      const allTypes = [...builtInTypes, ...customTypes.filter(ct => 
        !builtInTypes.some(bt => bt.id === ct.id)
      )];
      
      setServiceTypes(allTypes);
    } catch (error) {
      console.error("Erro ao carregar tipos de serviço:", error);
      toast.error("Não foi possível carregar os tipos de serviço");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = (serviceType: ServiceTypeData) => {
    setEditingServiceType(serviceType);
    setFormState({
      nome: serviceType.nome,
      etapa: serviceType.etapa,
      codigo: serviceType.codigo || "",
      descricao: serviceType.descricao || "",
    });
  };

  const handleDelete = async (id: string) => {
    // Prevent deletion of built-in types
    if (Object.keys(servicoToEtapaMapping).includes(id)) {
      toast.error("Não é possível excluir tipos de serviço padrão");
      return;
    }

    try {
      await updateDoc(doc(db, "tipos_servico", id), {
        ativo: false
      });
      
      setServiceTypes(prev => prev.map(st => 
        st.id === id ? {...st, ativo: false} : st
      ));
      
      toast.success("Tipo de serviço desativado com sucesso");
    } catch (error) {
      console.error("Erro ao excluir tipo de serviço:", error);
      toast.error("Não foi possível excluir o tipo de serviço");
    }
  };

  const handleCancel = () => {
    setEditingServiceType(null);
    setFormState({
      nome: "",
      etapa: "retifica",
      codigo: "",
      descricao: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.nome || !formState.etapa) {
      toast.error("Nome e etapa são campos obrigatórios");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a slug-like code if not provided
      const codigo = formState.codigo || 
        formState.nome.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '_');
      
      const serviceTypeData: ServiceTypeData = {
        id: editingServiceType?.id || uuidv4(),
        nome: formState.nome,
        etapa: formState.etapa,
        codigo: codigo,
        descricao: formState.descricao,
        ativo: true
      };
      
      // Save to Firestore
      if (editingServiceType) {
        await updateDoc(doc(db, "tipos_servico", serviceTypeData.id), {
          nome: serviceTypeData.nome,
          etapa: serviceTypeData.etapa,
          codigo: serviceTypeData.codigo,
          descricao: serviceTypeData.descricao,
          ativo: serviceTypeData.ativo
        });
        
        setServiceTypes(prev => prev.map(st => 
          st.id === serviceTypeData.id ? serviceTypeData : st
        ));
        toast.success("Tipo de serviço atualizado com sucesso");
      } else {
        await setDoc(doc(db, "tipos_servico", serviceTypeData.id), {
          id: serviceTypeData.id,
          nome: serviceTypeData.nome,
          etapa: serviceTypeData.etapa,
          codigo: serviceTypeData.codigo,
          descricao: serviceTypeData.descricao,
          ativo: serviceTypeData.ativo
        });
        
        setServiceTypes(prev => [...prev, serviceTypeData]);
        toast.success("Tipo de serviço criado com sucesso");
      }
      
      // Reset form
      setEditingServiceType(null);
      setFormState({
        nome: "",
        etapa: "retifica",
        codigo: "",
        descricao: "",
      });
    } catch (error) {
      console.error("Erro ao salvar tipo de serviço:", error);
      toast.error("Não foi possível salvar o tipo de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatServiceTypeName = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      inspecao_final: "Inspeção Final"
    };
    
    return labels[tipo] || tipo;
  };

  // Check if user has permissions
  if (funcionario?.nivelPermissao !== 'admin' && funcionario?.nivelPermissao !== 'gerente') {
    return (
      <Layout onLogout={onLogout}>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissões para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Tipos de Serviço</CardTitle>
            <CardDescription>
              Gerencie os tipos de serviço disponíveis no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Serviço</Label>
                  <Input
                    id="nome"
                    value={formState.nome}
                    onChange={e => handleInputChange("nome", e.target.value)}
                    placeholder="Ex: Retífica de Cabeçote"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="etapa">Etapa</Label>
                  <Select 
                    value={formState.etapa} 
                    onValueChange={val => handleInputChange("etapa", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapasOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código (opcional)</Label>
                  <Input
                    id="codigo"
                    value={formState.codigo}
                    onChange={e => handleInputChange("codigo", e.target.value)}
                    placeholder="Ex: retifica_cabecote"
                    disabled={editingServiceType && Object.keys(servicoToEtapaMapping).includes(editingServiceType.id)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código técnico para identificação do serviço no sistema
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    value={formState.descricao}
                    onChange={e => handleInputChange("descricao", e.target.value)}
                    placeholder="Breve descrição do serviço"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                {editingServiceType && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formState.nome || !formState.etapa}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      {editingServiceType ? "Atualizar" : "Adicionar"} Tipo de Serviço
                    </span>
                  )}
                </Button>
              </div>
            </form>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Tipos de Serviço Disponíveis</h3>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Nenhum tipo de serviço encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      serviceTypes
                        .sort((a, b) => {
                          // Sort by built-in types first, then by etapa, then by name
                          const aBuiltIn = Object.keys(servicoToEtapaMapping).includes(a.id);
                          const bBuiltIn = Object.keys(servicoToEtapaMapping).includes(b.id);
                          
                          if (aBuiltIn !== bBuiltIn) return aBuiltIn ? -1 : 1;
                          if (a.etapa !== b.etapa) return a.etapa.localeCompare(b.etapa);
                          return a.nome.localeCompare(b.nome);
                        })
                        .map(serviceType => {
                          const isBuiltIn = Object.keys(servicoToEtapaMapping).includes(serviceType.id);
                          
                          return (
                            <TableRow key={serviceType.id} className={!serviceType.ativo ? "opacity-50" : ""}>
                              <TableCell>
                                <div className="font-medium">{serviceType.nome}</div>
                                {isBuiltIn && (
                                  <div className="text-xs text-muted-foreground">Padrão do sistema</div>
                                )}
                              </TableCell>
                              <TableCell>
                                {etapasOptions.find(opt => opt.value === serviceType.etapa)?.label || serviceType.etapa}
                              </TableCell>
                              <TableCell>{serviceType.codigo}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  serviceType.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {serviceType.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEdit(serviceType)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  {!isBuiltIn && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDelete(serviceType.id)}
                                      disabled={!serviceType.ativo}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
