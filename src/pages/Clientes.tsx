
import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useClientes } from "@/hooks/useFirebase";
import { toast } from "sonner";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { clientes, loading, fetchClientes, saveCliente, deleteCliente } = useClientes();
  
  useEffect(() => {
    fetchClientes();
  }, []);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
    },
  });

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm)
  );

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      form.reset({
        nome: cliente.nome,
        telefone: cliente.telefone || "",
        email: cliente.email || "",
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

  const handleSubmit = async (values: ClienteFormValues) => {
    try {
      let clienteToSave: Cliente;
      
      if (editingCliente) {
        // Atualizar cliente existente
        clienteToSave = { 
          ...editingCliente, 
          nome: values.nome,
          telefone: values.telefone,
          email: values.email
        };
      } else {
        // Adicionar novo cliente
        clienteToSave = {
          id: "", // ID será atribuído pelo Firestore
          nome: values.nome,
          telefone: values.telefone,
          email: values.email,
        };
      }
      
      await saveCliente(clienteToSave);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (clienteToDelete) {
      await deleteCliente(clienteToDelete);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
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
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredClientes.length === 0 ? (
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
                    <span>{cliente.telefone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.email || "Não informado"}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleOpenDialog(cliente)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleOpenDeleteDialog(cliente.id)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCliente(cliente.id)}
                  >
                    Ver detalhes
                  </Button>
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
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
