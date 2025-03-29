import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutProps } from "@/types/props";

interface ClienteCadastroProps extends LogoutProps {}

const ClienteCadastro = ({ onLogout }: ClienteCadastroProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado para armazenar cliente atual
  const [cliente, setCliente] = useState<Cliente | null>(() => {
    if (id) {
      const clienteEncontrado = CLIENTES_MOCK.find(c => c.id === id);
      return clienteEncontrado || null;
    }
    return null;
  });
  
  // Estado para armazenar motores
  const [motores, setMotores] = useState<Motor[]>(cliente?.motores || []);
  
  // Estado para controlar o formulário de motor em edição
  const [motorEmEdicao, setMotorEmEdicao] = useState<Motor | null>(null);
  
  // Formulário do cliente
  const clienteForm = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: cliente ? {
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco: cliente.endereco || "",
      cnpj_cpf: cliente.cnpj_cpf || "",
      observacoes: cliente.observacoes || "",
    } : {
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cnpj_cpf: "",
      observacoes: "",
    }
  });
  
  // Formulário do motor
  const motorForm = useForm<MotorFormValues>({
    resolver: zodResolver(motorFormSchema),
    defaultValues: {
      marca: "",
      modelo: "",
      ano: "",
      numeroSerie: "",
      cilindradas: "",
      observacoes: "",
    }
  });
  
  // Função para salvar o cliente
  const handleSaveCliente = (values: ClienteFormValues) => {
    if (cliente) {
      // Atualizar cliente existente
      const clienteAtualizado: Cliente = {
        ...cliente,
        nome: values.nome, // Garantir que campos obrigatórios estejam presentes
        telefone: values.telefone,
        email: values.email,
        endereco: values.endereco,
        cnpj_cpf: values.cnpj_cpf,
        observacoes: values.observacoes,
        motores,
      };
      
      setCliente(clienteAtualizado);
      toast({
        title: "Cliente atualizado",
        description: `O cliente ${values.nome} foi atualizado com sucesso.`,
      });
    } else {
      // Criar novo cliente
      const novoCliente: Cliente = {
        id: `${Date.now()}`,
        nome: values.nome, // Garantir que campos obrigatórios estejam presentes
        telefone: values.telefone,
        email: values.email,
        endereco: values.endereco,
        cnpj_cpf: values.cnpj_cpf,
        observacoes: values.observacoes,
        motores,
      };
      
      setCliente(novoCliente);
      toast({
        title: "Cliente criado",
        description: `O cliente ${values.nome} foi criado com sucesso.`,
      });
    }
  };
  
  // Função para adicionar/atualizar um motor
  const handleSaveMotor = (values: MotorFormValues) => {
    if (motorEmEdicao) {
      // Atualizar motor existente
      const motoresAtualizados = motores.map(motor => 
        motor.id === motorEmEdicao.id ? { 
          ...motor, 
          marca: values.marca, // Garantir que campos obrigatórios estejam presentes
          modelo: values.modelo,
          ano: values.ano,
          numeroSerie: values.numeroSerie,
          cilindradas: values.cilindradas,
          observacoes: values.observacoes 
        } : motor
      );
      setMotores(motoresAtualizados);
      
      toast({
        title: "Motor atualizado",
        description: `O motor ${values.marca} ${values.modelo} foi atualizado.`,
      });
    } else {
      // Adicionar novo motor
      const novoMotor: Motor = {
        id: `motor_${Date.now()}`,
        marca: values.marca, // Garantir que campos obrigatórios estejam presentes
        modelo: values.modelo,
        ano: values.ano,
        numeroSerie: values.numeroSerie,
        cilindradas: values.cilindradas,
        observacoes: values.observacoes,
      };
      
      setMotores([...motores, novoMotor]);
      toast({
        title: "Motor adicionado",
        description: `O motor ${values.marca} ${values.modelo} foi adicionado.`,
      });
    }
    
    // Resetar formulário
    motorForm.reset({
      marca: "",
      modelo: "",
      ano: "",
      numeroSerie: "",
      cilindradas: "",
      observacoes: "",
    });
    
    setMotorEmEdicao(null);
  };
  
  // Função para começar a edição de um motor
  const handleEditMotor = (motor: Motor) => {
    setMotorEmEdicao(motor);
    motorForm.reset({
      marca: motor.marca,
      modelo: motor.modelo,
      ano: motor.ano || "",
      numeroSerie: motor.numeroSerie || "",
      cilindradas: motor.cilindradas || "",
      observacoes: motor.observacoes || "",
    });
  };
  
  // Função para remover um motor
  const handleRemoveMotor = (motorId: string) => {
    setMotores(motores.filter(motor => motor.id !== motorId));
    toast({
      variant: "destructive",
      title: "Motor removido",
      description: "O motor foi removido com sucesso.",
    });
  };
  
  // Função para cancelar a edição de um motor
  const handleCancelEditMotor = () => {
    setMotorEmEdicao(null);
    motorForm.reset({
      marca: "",
      modelo: "",
      ano: "",
      numeroSerie: "",
      cilindradas: "",
      observacoes: "",
    });
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {cliente ? "Editar Cliente" : "Novo Cliente"}
            </h1>
            <p className="text-muted-foreground">
              {cliente ? "Atualize as informações do cliente" : "Cadastre um novo cliente e seus motores"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/clientes")}>
              Cancelar
            </Button>
            <Button onClick={clienteForm.handleSubmit(handleSaveCliente)}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Cliente
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="info">
              <User className="mr-2 h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="motores">
              <Car className="mr-2 h-4 w-4" />
              Motores
              {motores.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {motores.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...clienteForm}>
                  <form className="space-y-4">
                    <FormField
                      control={clienteForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome / Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente ou empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={clienteForm.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Phone className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                                <Input placeholder="(00) 00000-0000" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clienteForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Mail className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                                <Input placeholder="email@exemplo.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={clienteForm.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <MapPin className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                              <Input placeholder="Rua, número, bairro - Cidade/UF" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clienteForm.control}
                      name="cnpj_cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ / CPF</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <ClipboardList className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                              <Input placeholder="00.000.000/0000-00 ou 000.000.000-00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clienteForm.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <AlertCircle className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                              <Textarea 
                                placeholder="Informações adicionais sobre o cliente" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="motores" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 order-1 lg:order-none">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {motorEmEdicao ? "Editar Motor" : "Adicionar Motor"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...motorForm}>
                      <form onSubmit={motorForm.handleSubmit(handleSaveMotor)} className="space-y-4">
                        <FormField
                          control={motorForm.control}
                          name="marca"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marca</FormLabel>
                              <FormControl>
                                <Input placeholder="Marca do motor" {...field} />
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
                                <Input placeholder="Modelo do motor" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={motorForm.control}
                            name="cilindradas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cilindradas</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: 1000cc" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={motorForm.control}
                            name="ano"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ano</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: 2010" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={motorForm.control}
                          name="numeroSerie"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Série</FormLabel>
                              <FormControl>
                                <Input placeholder="Número de série do motor" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={motorForm.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Informações adicionais sobre o motor" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex gap-2 justify-end">
                          {motorEmEdicao && (
                            <Button type="button" variant="outline" onClick={handleCancelEditMotor}>
                              Cancelar
                            </Button>
                          )}
                          <Button type="submit">
                            {motorEmEdicao ? "Atualizar" : "Adicionar"} Motor
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Motores do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {motores.length === 0 ? (
                      <div className="text-center py-8">
                        <Car className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="mt-2 text-lg font-medium">Nenhum motor cadastrado</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicione o primeiro motor do cliente utilizando o formulário.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {motores.map(motor => (
                          <Card key={motor.id} className="overflow-hidden">
                            <div className={`p-4 border-l-4 ${motorEmEdicao?.id === motor.id ? 'border-primary' : 'border-muted'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Car className="h-5 w-5" />
                                    {motor.marca} {motor.modelo}
                                    {motor.cilindradas && ` - ${motor.cilindradas}cc`}
                                  </h3>
                                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                    {(motor.ano || motor.numeroSerie) && (
                                      <p>
                                        {motor.ano && `Ano: ${motor.ano}`}
                                        {motor.ano && motor.numeroSerie && " | "}
                                        {motor.numeroSerie && `Nº Série: ${motor.numeroSerie}`}
                                      </p>
                                    )}
                                    {motor.observacoes && (
                                      <p>Obs: {motor.observacoes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEditMotor(motor)}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemoveMotor(motor.id)}
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClienteCadastro;
