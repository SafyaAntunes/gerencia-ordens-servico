import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogoutProps } from "@/types/props";
import { saveCliente, getCliente, saveMotor, deleteMotor } from "@/services/clienteService";
import { Cliente, Motor } from "@/types/clientes";
import { PlusCircle, Trash2, Edit, Car } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
  telefone: z.string().min(10, { message: "Telefone inválido" }),
  email: z.string().email({ message: "Email inválido" }).or(z.literal("")),
  endereco: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  observacoes: z.string().optional(),
});

const motorSchema = z.object({
  modelo: z.string().min(2, { message: "Modelo deve ter no mínimo 2 caracteres" }),
  marca: z.string().min(2, { message: "Marca deve ter no mínimo 2 caracteres" }),
  ano: z.string().optional(),
  numeroSerie: z.string().optional(),
  cilindrada: z.string().optional(),
  combustivel: z.enum(["gasolina", "diesel", "flex", "etanol", "gnv"]).optional(),
  observacoes: z.string().optional(),
});

type MotorFormValues = z.infer<typeof motorSchema>;

export default function ClienteCadastro({ onLogout }: LogoutProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [motores, setMotores] = useState<Motor[]>([]);
  const [isMotorDialogOpen, setIsMotorDialogOpen] = useState(false);
  const [currentMotor, setCurrentMotor] = useState<Motor | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cnpj_cpf: "",
      observacoes: "",
    },
  });
  
  const motorForm = useForm<MotorFormValues>({
    resolver: zodResolver(motorSchema),
    defaultValues: {
      modelo: "",
      marca: "",
      ano: "",
      numeroSerie: "",
      cilindrada: "",
      combustivel: undefined,
      observacoes: "",
    },
  });
  
  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const clienteData = await getCliente(id);
        
        if (clienteData) {
          console.log("Cliente carregado:", clienteData);
          setCliente(clienteData);
          
          form.reset({
            nome: clienteData.nome || "",
            telefone: clienteData.telefone || "",
            email: clienteData.email || "",
            endereco: typeof clienteData.endereco === 'string' ? clienteData.endereco : 
                     clienteData.endereco ? `${clienteData.endereco.rua}, ${clienteData.endereco.numero} - ${clienteData.endereco.cidade}/${clienteData.endereco.estado}` : "",
            cnpj_cpf: clienteData.cnpj_cpf || "",
            observacoes: clienteData.observacoes || "",
          });
          
          if (clienteData.motores && clienteData.motores.length > 0) {
            setMotores(clienteData.motores);
          }
        } else {
          toast.error("Cliente não encontrado");
          navigate("/clientes");
        }
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        toast.error("Erro ao carregar dados do cliente");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCliente();
  }, [id, navigate, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const clienteData: Cliente = {
        id: id || "",
        nome: values.nome,
        telefone: values.telefone,
        email: values.email,
        endereco: values.endereco,
        cnpj_cpf: values.cnpj_cpf,
        observacoes: values.observacoes,
        motores: motores,
      };
      
      await saveCliente(clienteData);
      
      toast.success(id ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
      navigate("/clientes");
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMotorAdd = () => {
    setCurrentMotor(null);
    motorForm.reset({
      modelo: "",
      marca: "",
      ano: "",
      numeroSerie: "",
      cilindrada: "",
      combustivel: undefined,
      observacoes: "",
    });
    setIsMotorDialogOpen(true);
  };
  
  const handleMotorEdit = (motor: Motor) => {
    setCurrentMotor(motor);
    motorForm.reset({
      modelo: motor.modelo,
      marca: motor.marca,
      ano: motor.ano || "",
      numeroSerie: motor.numeroSerie || "",
      cilindrada: motor.cilindrada || "",
      combustivel: motor.combustivel,
      observacoes: motor.observacoes || "",
    });
    setIsMotorDialogOpen(true);
  };
  
  const handleMotorDelete = (motorId: string) => {
    setMotores(prev => prev.filter(m => m.id !== motorId));
    toast.success("Motor removido");
  };
  
  const handleMotorSubmit = (values: MotorFormValues) => {
    const motor: Motor = {
      id: currentMotor?.id || `temp-${Date.now()}`,
      modelo: values.modelo,
      marca: values.marca,
      ano: values.ano,
      numeroSerie: values.numeroSerie,
      cilindrada: values.cilindrada,
      combustivel: values.combustivel,
      observacoes: values.observacoes,
    };
    
    if (currentMotor) {
      setMotores(prev => prev.map(m => m.id === motor.id ? motor : m));
    } else {
      setMotores(prev => [...prev, motor]);
    }
    
    setIsMotorDialogOpen(false);
    toast.success(currentMotor ? "Motor atualizado" : "Motor adicionado");
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">
          {id ? "Editar" : "Cadastrar"} Cliente
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Endereço completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cnpj_cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ / CPF</FormLabel>
                            <FormControl>
                              <Input placeholder="Documento" {...field} />
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
                              <Textarea 
                                placeholder="Observações sobre o cliente" 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate("/clientes")}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Salvando..." : id ? "Atualizar" : "Cadastrar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>Motores</CardTitle>
                  <Button onClick={handleMotorAdd} size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </CardHeader>
                <CardContent>
                  {motores.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Car className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>Nenhum motor cadastrado</p>
                      <p className="text-sm">Adicione motores para este cliente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {motores.map((motor) => (
                        <Card key={motor.id} className="overflow-hidden">
                          <div className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">
                                  {motor.marca} {motor.modelo}
                                </h3>
                                {motor.ano && (
                                  <p className="text-sm text-muted-foreground">
                                    Ano: {motor.ano}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleMotorEdit(motor)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleMotorDelete(motor.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              {motor.numeroSerie && (
                                <p className="text-sm">
                                  <span className="font-medium">Numeração:</span> {motor.numeroSerie}
                                </p>
                              )}
                              
                              {motor.cilindrada && (
                                <p className="text-sm">
                                  <span className="font-medium">Cilindrada:</span> {motor.cilindrada}
                                </p>
                              )}
                              
                              {motor.combustivel && (
                                <div className="mt-2">
                                  <Badge variant="outline">
                                    {motor.combustivel.charAt(0).toUpperCase() + motor.combustivel.slice(1)}
                                  </Badge>
                                </div>
                              )}
                              
                              {motor.observacoes && (
                                <p className="text-sm mt-2 text-muted-foreground">
                                  {motor.observacoes}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <Dialog open={isMotorDialogOpen} onOpenChange={setIsMotorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentMotor ? "Editar" : "Adicionar"} Motor
              </DialogTitle>
            </DialogHeader>
            
            <Form {...motorForm}>
              <form onSubmit={motorForm.handleSubmit(handleMotorSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={motorForm.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ford, Volkswagen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={motorForm.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: MWM, Cummins" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={motorForm.control}
                    name="ano"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 2020" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={motorForm.control}
                    name="numeroSerie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numeração</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de série" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={motorForm.control}
                    name="cilindrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cilindrada</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 2.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={motorForm.control}
                    name="combustivel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Combustível</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            {...field}
                            value={field.value || ""}
                          >
                            <option value="">Selecione</option>
                            <option value="gasolina">Gasolina</option>
                            <option value="diesel">Diesel</option>
                            <option value="flex">Flex</option>
                            <option value="etanol">Etanol</option>
                            <option value="gnv">GNV</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={motorForm.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre o motor" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMotorDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {currentMotor ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
