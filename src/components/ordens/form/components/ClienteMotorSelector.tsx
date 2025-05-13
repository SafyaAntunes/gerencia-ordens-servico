
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ClienteForm from "@/components/clientes/ClienteForm";
import { Motor } from "@/types/ordens";
import { Cliente } from "@/types/clientes";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import { toast } from "sonner";
import { getMotores } from "@/services/clienteService";
import { saveCliente } from "@/services/clienteService";

interface ClienteMotorSelectorProps {
  form: UseFormReturn<FormValues>;
  clientes: Cliente[];
  isLoadingClientes: boolean;
  onClienteChange: (clienteId: string) => void;
}

export const ClienteMotorSelector = ({ 
  form, 
  clientes, 
  isLoadingClientes,
  onClienteChange
}: ClienteMotorSelectorProps) => {
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false);
  const [isSubmittingCliente, setIsSubmittingCliente] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>(form.getValues().clienteId || "");
  const [motores, setMotores] = useState<Motor[]>([]);
  const [isLoadingMotores, setIsLoadingMotores] = useState(false);
  
  useEffect(() => {
    if (selectedClienteId) {
      const fetchMotores = async () => {
        setIsLoadingMotores(true);
        try {
          const motoresData = await getMotores(selectedClienteId);
          setMotores(motoresData);
        } catch (error) {
          console.error("Erro ao buscar motores:", error);
          toast.error("Não foi possível carregar os motores deste cliente");
          setMotores([]);
        } finally {
          setIsLoadingMotores(false);
        }
      };
      
      fetchMotores();
    } else {
      setMotores([]);
    }
  }, [selectedClienteId]);
  
  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    form.setValue("motorId", "");
    onClienteChange(clienteId);
  };
  
  const handleNovoClienteSubmit = async (data: any) => {
    setIsSubmittingCliente(true);
    
    try {
      const novoCliente: Cliente = {
        id: "",
        nome: data.nome,
        telefone: data.telefone,
        email: data.email || "",
        observacoes: data.observacoes || "",
      };
      
      const success = await saveCliente(novoCliente);
      
      if (success) {
        toast.success("Cliente cadastrado com sucesso!");
        setIsNovoClienteOpen(false);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setIsSubmittingCliente(false);
    }
  };
  
  return (
    <>
      <FormField
        control={form.control}
        name="clienteId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <span>Cliente</span>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setIsNovoClienteOpen(true)}
                className="h-8"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Novo Cliente
              </Button>
            </FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                handleClienteChange(value);
              }} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClientes ? "Carregando clientes..." : "Selecione um cliente"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white">
                {isLoadingClientes ? (
                  <div className="p-2 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs mt-1">Carregando...</p>
                  </div>
                ) : clientes.length === 0 ? (
                  <div className="p-2 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  clientes.map((cliente) => (
                    <SelectItem 
                      key={cliente.id} 
                      value={cliente.id}
                    >
                      {cliente.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Cliente vinculado à OS
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="motorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Motor</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={!selectedClienteId || isLoadingMotores || motores.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedClienteId 
                      ? "Selecione um cliente primeiro" 
                      : isLoadingMotores 
                        ? "Carregando motores..." 
                        : motores.length === 0 
                          ? "Nenhum motor cadastrado para este cliente" 
                          : "Selecione um motor"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white">
                {isLoadingMotores ? (
                  <div className="p-2 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs mt-1">Carregando...</p>
                  </div>
                ) : (
                  motores.map((motor) => (
                    <SelectItem 
                      key={motor.id} 
                      value={motor.id}
                    >
                      {motor.marca} {motor.modelo} {motor.numeroSerie ? `- ${motor.numeroSerie}` : ''} {motor.ano ? `(${motor.ano})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Motor do cliente a ser retificado
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Dialog open={isNovoClienteOpen} onOpenChange={setIsNovoClienteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente para esta ordem de serviço.
            </DialogDescription>
          </DialogHeader>
          
          <ClienteForm
            onSubmit={handleNovoClienteSubmit}
            onCancel={() => setIsNovoClienteOpen(false)}
            isSubmitting={isSubmittingCliente}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
