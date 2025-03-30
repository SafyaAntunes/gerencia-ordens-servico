import { useState, useEffect } from "react";
import { PlusCircle, Filter, Search, Users, CheckCircle2, Shield, Lock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import FuncionarioCard from "@/components/funcionarios/FuncionarioCard";
import FuncionarioDetalhes from "@/components/funcionarios/FuncionarioDetalhes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Funcionario, NivelPermissao, permissoesLabels } from "@/types/funcionarios";
import { TipoServico } from "@/types/ordens";
import { useFuncionarios } from "@/hooks/useFirebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const tiposServicos = [
  { id: "bloco", label: "Bloco" },
  { id: "biela", label: "Biela" },
  { id: "cabecote", label: "Cabeçote" },
  { id: "virabrequim", label: "Virabrequim" },
  { id: "eixo_comando", label: "Eixo de Comando" },
];

const niveisPermissao = [
  { id: "admin", label: "Administrador" },
  { id: "gerente", label: "Gerente" },
  { id: "tecnico", label: "Técnico" },
  { id: "visualizacao", label: "Visualização" },
];

const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  telefone: z.string().min(8, { message: "Telefone inválido" }),
  especialidades: z.array(z.string()).min(1, { message: "Selecione pelo menos uma especialidade" }),
  ativo: z.boolean().default(true),
  nivelPermissao: z.enum(["admin", "gerente", "tecnico", "visualizacao"]).default("visualizacao"),
  senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }).optional(),
  confirmarSenha: z.string().optional(),
  nomeUsuario: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }).optional(),
}).refine((data) => {
  if (data.senha) {
    return data.senha === data.confirmarSenha;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type FormValues = z.infer<typeof formSchema>;

const Funcionarios = ({ onLogout }: { onLogout?: () => void }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [especialidadeFilter, setEspecialidadeFilter] = useState<TipoServico | "todas">("todas");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "inativos" | "todos">("todos");
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<string | null>(null);
  
  const { funcionarios, loading, fetchFuncionarios, saveFuncionario, deleteFuncionario } = useFuncionarios();
  const { funcionario: currentUser, hasPermission } = useAuth();
  
  useEffect(() => {
    fetchFuncionarios();
  }, []);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      especialidades: [],
      ativo: true,
      nivelPermissao: "visualizacao",
      senha: "",
      confirmarSenha: "",
      nomeUsuario: "",
    },
  });
  
  const handleCreateFuncionario = async (values: FormValues) => {
    const { confirmarSenha, ...funcionarioData } = values;
    
    try {
      if (isEditing && selectedFuncionario) {
        const updatedFuncionario: Funcionario = {
          ...selectedFuncionario,
          nome: funcionarioData.nome,
          email: funcionarioData.email,
          telefone: funcionarioData.telefone,
          especialidades: funcionarioData.especialidades as TipoServico[],
          ativo: funcionarioData.ativo,
          nivelPermissao: funcionarioData.nivelPermissao,
        };
        
        const success = await saveFuncionario(updatedFuncionario);
        
        if (success) {
          toast.success("Funcionário atualizado com sucesso!");
          setIsDialogOpen(false);
          form.reset();
          fetchFuncionarios();
        }
      } else {
        const novoFuncionario: Funcionario = {
          id: uuidv4(),
          nome: funcionarioData.nome,
          email: funcionarioData.email,
          telefone: funcionarioData.telefone,
          especialidades: funcionarioData.especialidades as TipoServico[],
          ativo: funcionarioData.ativo,
          nivelPermissao: funcionarioData.nivelPermissao,
          senha: funcionarioData.senha,
          nomeUsuario: funcionarioData.nomeUsuario,
        };
        
        const success = await saveFuncionario(novoFuncionario);
        
        if (success) {
          toast.success("Funcionário criado com sucesso!");
          setIsDialogOpen(false);
          form.reset();
          fetchFuncionarios();
        }
      }
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
      toast.error("Erro ao salvar funcionário");
    }
  };
  
  const handleViewDetails = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsDetalhesOpen(true);
  };
  
  const handleEditFuncionario = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsEditing(true);
    
    form.reset({
      nome: funcionario.nome,
      email: funcionario.email,
      telefone: funcionario.telefone,
      especialidades: funcionario.especialidades,
      ativo: funcionario.ativo,
      nivelPermissao: funcionario.nivelPermissao || "visualizacao",
      senha: "",
      confirmarSenha: "",
      nomeUsuario: "",
    });
    
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (funcionarioToDelete) {
      try {
        await deleteFuncionario(funcionarioToDelete);
        toast.success("Funcionário excluído com sucesso!");
        fetchFuncionarios();
      } catch (error) {
        console.error("Erro ao excluir funcionário:", error);
        toast.error("Erro ao excluir funcionário");
      } finally {
        setDeleteDialogOpen(false);
        setFuncionarioToDelete(null);
      }
    }
  };
  
  const handleDeleteFuncionario = (id: string) => {
    setFuncionarioToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleUpdateFuncionario = async (funcionario: Funcionario) => {
    try {
      const success = await saveFuncionario(funcionario);
      if (success) {
        toast.success("Funcionário atualizado com sucesso!");
        fetchFuncionarios();
      }
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      toast.error("Erro ao atualizar funcionário");
    }
  };
  
  const filteredFuncionarios = funcionarios.filter((funcionario) => {
    const matchesSearch = searchTerm === "" ||
      funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funcionario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEspecialidade = especialidadeFilter === "todas" || 
      funcionario.especialidades.includes(especialidadeFilter);
    
    const matchesStatus = statusFilter === "todos" ||
      (statusFilter === "ativos" && funcionario.ativo) ||
      (statusFilter === "inativos" && !funcionario.ativo);
    
    return matchesSearch && matchesEspecialidade && matchesStatus;
  });
  
  const funcionariosAtivos = filteredFuncionarios.filter(f => f.ativo);
  const funcionariosInativos = filteredFuncionarios.filter(f => !f.ativo);

  const canManageFuncionarios = currentUser && hasPermission('gerente');
  
  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie os funcionários da sua retífica
            </p>
          </div>
          
          {canManageFuncionarios && (
            <Button onClick={() => {
              setIsEditing(false);
              form.reset({
                nome: "",
                email: "",
                telefone: "",
                especialidades: [],
                ativo: true,
                nivelPermissao: "visualizacao",
                senha: "",
                confirmarSenha: "",
                nomeUsuario: "",
              });
              setIsDialogOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <Select
              value={especialidadeFilter}
              onValueChange={(value) => setEspecialidadeFilter(value as TipoServico | "todas")}
            >
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Especialidades</SelectItem>
                <SelectItem value="bloco">Bloco</SelectItem>
                <SelectItem value="biela">Biela</SelectItem>
                <SelectItem value="cabecote">Cabeçote</SelectItem>
                <SelectItem value="virabrequim">Virabrequim</SelectItem>
                <SelectItem value="eixo_comando">Eixo de Comando</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "ativos" | "inativos" | "todos")}
            >
              <SelectTrigger className="w-32">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="todos" className="mt-4">
          <TabsList className="mb-6">
            <TabsTrigger value="todos" className="relative">
              Todos
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filteredFuncionarios.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="ativos" className="relative">
              Ativos
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {funcionariosAtivos.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="inativos" className="relative">
              Inativos
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {funcionariosInativos.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos">
            {filteredFuncionarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum funcionário encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhum funcionário com os filtros selecionados. {canManageFuncionarios && "Tente ajustar os filtros ou adicionar um novo funcionário."}
                </p>
                {canManageFuncionarios && (
                  <Button className="mt-4" onClick={() => {
                    setIsEditing(false);
                    form.reset();
                    setIsDialogOpen(true);
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Funcionário
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFuncionarios.map((funcionario) => (
                  <FuncionarioCard
                    key={funcionario.id}
                    funcionario={funcionario}
                    onClick={() => handleViewDetails(funcionario)}
                    onEdit={canManageFuncionarios ? () => handleEditFuncionario(funcionario) : undefined}
                    onDelete={canManageFuncionarios ? () => handleDeleteFuncionario(funcionario.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ativos">
            {funcionariosAtivos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum funcionário ativo encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhum funcionário ativo com os filtros selecionados.
                </p>
                {canManageFuncionarios && (
                  <Button className="mt-4" onClick={() => {
                    setIsEditing(false);
                    form.reset();
                    setIsDialogOpen(true);
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Funcionário
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {funcionariosAtivos.map((funcionario) => (
                  <FuncionarioCard
                    key={funcionario.id}
                    funcionario={funcionario}
                    onClick={() => handleViewDetails(funcionario)}
                    onEdit={canManageFuncionarios ? () => handleEditFuncionario(funcionario) : undefined}
                    onDelete={canManageFuncionarios ? () => handleDeleteFuncionario(funcionario.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inativos">
            {funcionariosInativos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum funcionário inativo encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhum funcionário inativo com os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {funcionariosInativos.map((funcionario) => (
                  <FuncionarioCard
                    key={funcionario.id}
                    funcionario={funcionario}
                    onClick={() => handleViewDetails(funcionario)}
                    onEdit={canManageFuncionarios ? () => handleEditFuncionario(funcionario) : undefined}
                    onDelete={canManageFuncionarios ? () => handleDeleteFuncionario(funcionario.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
              <DialogDescription>
                Preencha todos os campos para {isEditing ? "atualizar" : "cadastrar"} um funcionário.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateFuncionario)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivelPermissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Permissão</FormLabel>
                      <FormDescription className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        Defina o que este funcionário pode fazer no sistema
                      </FormDescription>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {niveisPermissao.map(nivel => (
                            <SelectItem key={nivel.id} value={nivel.id}>
                              {nivel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel className="text-base">Especialidades</FormLabel>
                  <FormDescription className="mb-3">
                    Selecione os serviços que este funcionário pode realizar.
                  </FormDescription>
                  
                  <div className="rounded-md border border-border p-4">
                    <FormField
                      control={form.control}
                      name="especialidades"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tiposServicos.map((tipo) => (
                              <FormField
                                key={tipo.id}
                                control={form.control}
                                name="especialidades"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={tipo.id}
                                      className="flex items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(tipo.id)}
                                          onCheckedChange={(checked) => {
                                            const updatedValue = checked
                                              ? [...field.value, tipo.id]
                                              : field.value?.filter(
                                                  (value) => value !== tipo.id
                                                );
                                            field.onChange(updatedValue);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {tipo.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div className="space-y-4 rounded-md border border-border p-4">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <FormLabel className="text-base">Credenciais de Acesso</FormLabel>
                    </div>
                    
                    <FormDescription className="mt-0">
                      Defina uma senha e um nome de usuário para que o funcionário possa acessar o sistema.
                    </FormDescription>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="nomeUsuario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="nome.sobrenome" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="senha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmarSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div>
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Funcionários inativos não aparecerão nas listas de atribuição de tarefas.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">{isEditing ? "Atualizar" : "Salvar"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <FuncionarioDetalhes 
          funcionario={selectedFuncionario} 
          isOpen={isDetalhesOpen} 
          onClose={() => setIsDetalhesOpen(false)}
          onSave={handleUpdateFuncionario}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Funcionarios;
