import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, Building, Phone, Mail, FilterX, Car } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cliente } from "@/types/clientes";
import { getClientes, saveCliente, deleteCliente } from "@/services/clienteService";
import ClienteForm from "@/components/clientes/ClienteForm";
import ClienteCard from "@/components/clientes/ClienteCard";
import ClienteDetalhes from "@/components/clientes/ClienteDetalhes";
import { toast } from "sonner";
import ExportButton from "@/components/common/ExportButton";
import ImportButton from "@/components/common/ImportButton";

interface ClientesProps {
  onLogout?: () => void;
}

export default function Clientes({ onLogout }: ClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Fetch clientes on mount
  useEffect(() => {
    fetchClientes();
  }, []);
  
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter clientes based on search
  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm)
  );
  
  const handleOpenAddDialog = () => {
    setSelectedCliente(null);
    setIsDialogOpen(true);
  };
  
  const handleOpenEditDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDialogOpen(true);
  };
  
  const handleOpenDetailsDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDetalhesOpen(true);
  };
  
  const handleOpenDeleteDialog = (id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Prepare cliente object
      const clienteData: Cliente = selectedCliente
        ? { ...selectedCliente, ...values }
        : {
            id: "",
            ...values,
          };
      
      // Save cliente
      const success = await saveCliente(clienteData);
      
      if (success) {
        toast.success(
          selectedCliente
            ? "Cliente atualizado com sucesso!"
            : "Cliente cadastrado com sucesso!"
        );
        setIsDialogOpen(false);
        fetchClientes();
      }
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      const success = await deleteCliente(clienteToDelete);
      
      if (success) {
        toast.success("Cliente excluído com sucesso!");
        fetchClientes();
        setDeleteDialogOpen(false);
        setClienteToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleAdvancedEdit = (cliente: Cliente) => {
    navigate(`/clientes/editar/${cliente.id}`);
  };
  
  const handleImportClientes = async (data: any) => {
    if (!Array.isArray(data)) {
      toast.error('Formato inválido. Esperado uma lista de clientes.');
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    
    try {
      for (const clienteData of data) {
        // Verificar se o cliente tem dados mínimos necessários
        if (!clienteData.nome) {
          continue;
        }
        
        const cliente: Cliente = {
          id: '',  // ID será gerado no servidor
          ...clienteData,
        };
        
        const success = await saveCliente(cliente);
        if (success) successCount++;
      }
      
      toast.success(`${successCount} cliente(s) importado(s) com sucesso!`);
      fetchClientes();
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      toast.error('Erro ao importar clientes.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const validateClienteData = (data: any): boolean => {
    return Array.isArray(data) && data.some(item => !!item.nome);
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes da sua retífica
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <ImportButton 
              onImport={handleImportClientes} 
              validateData={validateClienteData}
              disabled={isSubmitting}
            />
            <ExportButton 
              data={clientes}
              fileName="clientes.json"
              disabled={clientes.length === 0}
            />
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1">
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
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
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
            <Button className="mt-4" onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onView={handleOpenDetailsDialog}
                onEdit={handleOpenEditDialog}
                onDelete={handleOpenDeleteDialog}
              />
            ))}
          </div>
        )}
        
        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedCliente ? "Editar" : "Novo"} Cliente</DialogTitle>
              <DialogDescription>
                Para cadastro completo com motores, use a <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary underline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    selectedCliente ? 
                      navigate(`/clientes/editar/${selectedCliente.id}`) : 
                      navigate("/clientes/cadastro");
                  }}
                >
                  página de cadastro avançado
                </Button>.
              </DialogDescription>
            </DialogHeader>
            
            <ClienteForm
              initialData={selectedCliente}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
        
        {/* View Details Dialog */}
        <ClienteDetalhes 
          cliente={selectedCliente} 
          isOpen={isDetalhesOpen} 
          onClose={() => setIsDetalhesOpen(false)}
          onEdit={(cliente) => {
            setIsDetalhesOpen(false);
            setTimeout(() => handleOpenEditDialog(cliente), 100);
          }}
        />

        {/* Confirm Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
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
      </div>
    </Layout>
  );
}
