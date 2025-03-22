import { useState } from "react";
import { Plus, Search, Trash2, Edit, User } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Cliente } from "@/types/clientes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  telefone: z.string().min(8, {
    message: "Telefone deve ter pelo menos 8 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  observacoes: z.string().optional(),
});

export default function Clientes({ onLogout }: { onLogout: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cidade: "",
      estado: "",
      observacoes: "",
    },
  });

  const handleCreateCliente = (values: z.infer<typeof formSchema>) => {
    console.log("Novo cliente:", values);
    setIsDialogOpen(false);
    toast({
      title: "Cliente criado com sucesso!",
      description: "O cliente foi adicionado à sua lista.",
    });
    form.reset();
  };

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    form.setValue("nome", cliente.nome);
    form.setValue("telefone", cliente.telefone);
    form.setValue("email", cliente.email);
    form.setValue("endereco", cliente.endereco || "");
    form.setValue("cidade", cliente.cidade || "");
    form.setValue("estado", cliente.estado || "");
    form.setValue("observacoes", cliente.observacoes || "");
    setIsDialogOpen(true);
  };

  const handleDeleteCliente = (clienteId: string) => {
    console.log("Deletando cliente:", clienteId);
    toast({
      title: "Cliente deletado!",
      description: "O cliente foi removido da sua lista.",
    });
  };

  const clientesMock: Cliente[] = [
    {
      id: "1",
      nome: "Auto Peças Silva",
      telefone: "(11) 98765-4321",
      email: "contato@autopecassilva.com.br",
      endereco: "Rua das Peças, 123",
      cidade: "São Paulo",
      estado: "SP",
      observacoes: "Cliente desde 2019",
      dataCadastro: new Date(2019, 5, 15),
    },
    {
      id: "2",
      nome: "Oficina Mecânica Central",
      telefone: "(11) 3333-4444",
      email: "oficina@central.com.br",
      endereco: "Av. Central, 456",
      cidade: "São Paulo",
      estado: "SP",
      observacoes: "Prefere entrega expressa",
      dataCadastro: new Date(2020, 2, 10),
    },
    {
      id: "3",
      nome: "Transportadora Rodovia",
      telefone: "(11) 5555-6666",
      email: "manutencao@rodovia.com.br",
      endereco: "Rodovia dos Transportes, 789",
      cidade: "Guarulhos",
      estado: "SP",
      observacoes: "Atendimento prioritário",
      dataCadastro: new Date(2018, 8, 22),
    },
    {
      id: "4",
      nome: "Autoelétrica Express",
      telefone: "(11) 7777-8888",
      email: "atendimento@express.com.br",
      endereco: "Rua da Eletricidade, 321",
      cidade: "Osasco",
      estado: "SP",
      dataCadastro: new Date(2021, 4, 5),
    },
    {
      id: "5",
      nome: "Concessionária Motors",
      telefone: "(11) 9999-0000",
      email: "pecas@motors.com.br",
      endereco: "Av. dos Automóveis, 654",
      cidade: "São Paulo",
      estado: "SP",
      observacoes: "Contrato de manutenção mensal",
      dataCadastro: new Date(2017, 11, 3),
    },
  ];

  const filteredClientes = clientesMock.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e informações de contato
            </p>
          </div>
          <Button onClick={() => {
            setEditingCliente(null);
            form.reset();
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <div className="relative w-full mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="todos">
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
          <TabsContent value="todos">
            {filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Não encontramos nenhum cliente com o termo de busca atual.
                  Tente ajustar sua busca ou adicione um novo cliente.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClientes.map((cliente) => (
                  <Card key={cliente.id}>
                    <CardHeader>
                      <CardTitle>{cliente.nome}</CardTitle>
                      <CardDescription>{cliente.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        <li>
                          <span className="font-medium">Telefone:</span> {cliente.telefone}
                        </li>
                        {cliente.endereco && (
                          <li>
                            <span className="font-medium">Endereço:</span> {cliente.endereco}
                          </li>
                        )}
                        {cliente.cidade && cliente.estado && (
                          <li>
                            <span className="font-medium">Localização:</span> {cliente.cidade}, {cliente.estado}
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCliente(cliente)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCliente(cliente.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              <DialogDescription>
                Preencha todos os campos para {editingCliente ? "editar" : "cadastrar"} um novo cliente.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(editingCliente ? handleCreateCliente : handleCreateCliente)} className="space-y-6">
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do cliente" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este é o nome que será exibido para o cliente.
                        </FormDescription>
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
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormDescription>
                          Número de telefone para contato.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="cliente@email.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Endereço de email do cliente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} />
                        </FormControl>
                        <FormDescription>
                          Endereço completo do cliente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Estado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Input placeholder="Observações" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{editingCliente ? "Salvar Alterações" : "Criar Cliente"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
