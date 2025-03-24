import { useState, useEffect } from "react";
import { PlusCircle, Filter, Search, Users, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
import { Funcionario } from "@/types/funcionarios";
import { TipoServico } from "@/types/ordens";

// Dados iniciais
const funcionariosIniciais: Funcionario[] = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 98765-4321",
    especialidades: ["bloco", "virabrequim"],
    ativo: true,
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    email: "maria.oliveira@email.com",
    telefone: "(11) 91234-5678",
    especialidades: ["cabecote", "biela"],
    ativo: true,
  },
  {
    id: "3",
    nome: "Pedro Santos",
    email: "pedro.santos@email.com",
    telefone: "(11) 98888-7777",
    especialidades: ["eixo_comando", "virabrequim", "bloco"],
    ativo: false,
  },
  {
    id: "4",
    nome: "Ana Costa",
    email: "ana.costa@email.com",
    telefone: "(11) 97777-6666",
    especialidades: ["cabecote", "biela", "eixo_comando"],
    ativo: true,
  },
  {
    id: "5",
    nome: "Roberto Ferreira",
    email: "roberto.ferreira@email.com",
    telefone: "(11) 96666-5555",
    especialidades: ["bloco"],
    ativo: true,
  },
];

const tiposServicos = [
  { id: "bloco", label: "Bloco" },
  { id: "biela", label: "Biela" },
  { id: "cabecote", label: "Cabeçote" },
  { id: "virabrequim", label: "Virabrequim" },
  { id: "eixo_comando", label: "Eixo de Comando" },
];

const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  telefone: z.string().min(8, { message: "Telefone inválido" }),
  especialidades: z.array(z.string()).min(1, { message: "Selecione pelo menos uma especialidade" }),
  ativo: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const Funcionarios = ({ onLogout }: { onLogout?: () => void }) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [especialidadeFilter, setEspecialidadeFilter] = useState<TipoServico | "todas">("todas");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "inativos" | "todos">("todos");
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  
  // Carregar funcionários do localStorage ao iniciar
  useEffect(() => {
    const funcionariosSalvos = localStorage.getItem("sgr-funcionarios");
    if (funcionariosSalvos) {
      setFuncionarios(JSON.parse(funcionariosSalvos));
    } else {
      // Se não houver dados salvos, usar os dados iniciais
      setFuncionarios(funcionariosIniciais);
      localStorage.setItem("sgr-funcionarios", JSON.stringify(funcionariosIniciais));
    }
  }, []);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      especialidades: [],
      ativo: true,
    },
  });
  
  const handleCreateFuncionario = (values: FormValues) => {
    // Gerar ID único para o novo funcionário
    const newId = `f-${Date.now()}`;
    
    // Criar novo funcionário
    const novoFuncionario: Funcionario = {
      id: newId,
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      especialidades: values.especialidades as TipoServico[],
      ativo: values.ativo,
    };
    
    // Adicionar ao estado e salvar no localStorage
    const funcionariosAtualizados = [...funcionarios, novoFuncionario];
    setFuncionarios(funcionariosAtualizados);
    localStorage.setItem("sgr-funcionarios", JSON.stringify(funcionariosAtualizados));
    
    // Fechar diálogo e resetar formulário
    setIsDialogOpen(false);
    form.reset();
    
    // Mostrar mensagem de sucesso
    toast({
      title: "Funcionário cadastrado",
      description: `${values.nome} foi adicionado com sucesso.`,
    });
  };
  
  const handleViewDetails = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsDetalhesOpen(true);
  };
  
  const handleUpdateFuncionario = (funcionarioAtualizado: Funcionario) => {
    // Atualizar funcionário na lista
    const funcionariosAtualizados = funcionarios.map(f => 
      f.id === funcionarioAtualizado.id ? funcionarioAtualizado : f
    );
    
    // Atualizar estado e localStorage
    setFuncionarios(funcionariosAtualizados);
    localStorage.setItem("sgr-funcionarios", JSON.stringify(funcionariosAtualizados));
    
    // Fechar diálogo de detalhes
    setIsDetalhesOpen(false);
    
    // Mostrar mensagem de sucesso
    toast({
      title: "Funcionário atualizado",
      description: `Dados de ${funcionarioAtualizado.nome} foram atualizados com sucesso.`,
    });
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
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
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
                  Não encontramos nenhum funcionário com os filtros selecionados. Tente ajustar os filtros ou adicionar um novo funcionário.
                </p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Funcionário
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFuncionarios.map((funcionario) => (
                  <FuncionarioCard
                    key={funcionario.id}
                    funcionario={funcionario}
                    onClick={() => handleViewDetails(funcionario)}
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
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Funcionário
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {funcionariosAtivos.map((funcionario) => (
                  <FuncionarioCard
                    key={funcionario.id}
                    funcionario={funcionario}
                    onClick={() => handleViewDetails(funcionario)}
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
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Funcionário</DialogTitle>
              <DialogDescription>
                Preencha todos os campos para cadastrar um novo funcionário.
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
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <FuncionarioDetalhes 
          funcionario={selectedFuncionario} 
          isOpen={isDetalhesOpen} 
          onClose={() => setIsDetalhesOpen(false)}
          onUpdate={handleUpdateFuncionario}
        />
      </div>
    </Layout>
  );
};

export default Funcionarios;
