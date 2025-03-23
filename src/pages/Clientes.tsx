
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Building, Phone, Mail, Edit, Trash, Users, FilterX, Car } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Cliente } from "@/types/ordens";
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
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

// Dados de exemplo
const CLIENTES: Cliente[] = [
  {
    id: "1",
    nome: "Auto Peças Silva",
    telefone: "(11) 98765-4321",
    email: "contato@autopecassilva.com.br",
    endereco: "Rua das Retíficas, 123 - São Paulo/SP",
    cnpj_cpf: "12.345.678/0001-90",
    motores: [
      {
        id: "m1",
        marca: "Volkswagen",
        modelo: "AP 1.8",
        ano: "2010",
        numeroSerie: "AP18123456",
        cilindradas: "1800",
      },
      {
        id: "m2",
        marca: "Fiat",
        modelo: "Fire 1.0",
        ano: "2015",
        numeroSerie: "FIRE789456",
        cilindradas: "1000",
      }
    ]
  },
  {
    id: "2",
    nome: "Oficina Mecânica Central",
    telefone: "(11) 3333-4444",
    email: "oficina@central.com.br",
  },
  {
    id: "3",
    nome: "Concessionária Motors",
    telefone: "(11) 9999-0000",
    email: "pecas@motors.com.br",
    motores: [
      {
        id: "m3",
        marca: "Toyota",
        modelo: "Corolla 2.0",
        ano: "2019",
        numeroSerie: "CRL2019123",
        cilindradas: "2000",
      }
    ]
  },
  {
    id: "4",
    nome: "Autoelétrica Express",
    telefone: "(11) 7777-8888",
    email: "atendimento@express.com.br",
  },
  {
    id: "5",
    nome: "Transportadora Rodovia",
    telefone: "(11) 5555-6666",
    email: "manutencao@rodovia.com.br",
  },
];

// Schema para o formulário de cliente
const clienteFormSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(8, "O telefone deve ter pelo menos 8 caracteres"),
  email: z.string().email("Email inválido"),
});

type ClienteFormValues = z.infer<typeof clienteFormSchema>;

interface ClientesProps {
  onLogout: () => void;
}

export default function Clientes({ onLogout }: ClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
    },
  });

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      form.reset({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
      });
    } else {
      setEditingCliente(null);
      form.reset({
        nome: "",
        telefone: "",
        email: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: ClienteFormValues) => {
    if (editingCliente) {
      // Atualizar cliente existente
      setClientes(clientes.map(c => 
        c.id === editingCliente.id ? { ...c, ...values } : c
      ));
      toast({
        title: "Cliente atualizado",
        description: `O cliente ${values.nome} foi atualizado com sucesso.`,
      });
    } else {
      // Adicionar novo cliente
      const newCliente: Cliente = {
        id: `${Date.now()}`, // Gera um ID baseado no timestamp atual
        ...values,
      };
      setClientes([...clientes, newCliente]);
      toast({
        title: "Cliente adicionado",
        description: `O cliente ${values.nome} foi adicionado com sucesso.`,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
    toast({
      title: "Cliente removido",
      description: "O cliente foi removido com sucesso.",
      variant: "destructive",
    });
  };

  // Funções para navegação
  const handleAddCliente = () => {
    navigate("/clientes/cadastro");
  };

  const handleEditCliente = (id: string) => {
    navigate(`/clientes/editar/${id}`);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes da sua retífica
            </p>
          </div>
          
          <Button onClick={handleAddCliente}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && (
            <Button variant="outline" size="icon" onClick={() => setSearchTerm("")}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {filteredClientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {searchTerm ? (
                <>
                  Não encontramos nenhum cliente com o termo <strong>"{searchTerm}"</strong>. Tente ajustar a busca ou cadastre um novo cliente.
                </>
              ) : (
                "Comece adicionando seu primeiro cliente para poder criar ordens de serviço."
              )}
            </p>
            <Button className="mt-4" onClick={handleAddCliente}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{cliente.nome}</span>
                    {cliente.motores && cliente.motores.length > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {cliente.motores.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.email}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEditCliente(cliente.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cliente "{cliente.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(cliente.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCliente ? "Editar" : "Novo"} Cliente</DialogTitle>
            <DialogDescription>
              Para cadastro completo com motores, use a <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => {
                  setIsDialogOpen(false);
                  editingCliente ? 
                    navigate(`/clientes/editar/${editingCliente.id}`) : 
                    navigate("/clientes/cadastro");
                }}
              >
                página de cadastro avançado
              </Button>.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome / Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa ou pessoa" {...field} />
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
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
