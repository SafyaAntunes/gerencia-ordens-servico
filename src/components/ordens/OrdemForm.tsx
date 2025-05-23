import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Plus, X, Camera, UserPlus, User, Clock, Droplet, Search, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Prioridade, TipoServico, Motor, SubAtividade, TipoAtividade, EtapaOS } from "@/types/ordens";
import { Cliente } from "@/types/clientes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FotosForm from "./FotosForm";
import { ServicoSubatividades } from "./ServicoSubatividades";
import ClienteForm from "@/components/clientes/ClienteForm";
import { v4 as uuidv4 } from "uuid";
import { saveCliente, getMotores } from "@/services/clienteService";
import { getSubatividades, getSubatividadesByTipo } from "@/services/subatividadeService";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SUBATIVIDADES: Record<TipoServico, string[]> = {
  bloco: [
    'RETÍFICA DE CILINDRO',
    'ENCAMISAR',
    'BRUNIR',
    'RETIFICAR MANCAL',
    'LAVAGEM QUÍMICA',
    'RETIFICA DE FAZE',
    'SERVIÇO DE SOLDA',
    'MEDIR MANCAL',
    'EXTRAIR PRISIONEIRO',
    'RETÍFICA DE ROSCA'
  ],
  cabecote: [
    'DESCARBONIZAR',
    'SERVIÇO DE SOLDA',
    'RETÍFICA FACE',
    'MUDAR GUIA',
    'MUDAR SEDE',
    'RETÍFICA DE SEDE',
    'RETÍFICA DE VÁLVULAS',
    'ESMERILHAR',
    'CALIBRAR VÁLVULAS',
    'DESMONTAR',
    'MONTAR VÁLVULAR',
    'FACE LATERAL',
    'EXTRAIR PRISIONEIRO',
    'RECUPERAR ROSCA',
    'RETÍFICA MANCAL DE COMANDO',
    'TESTE DE TRINCA',
    'TESTADO',
    'TESTAR MOLAS'
  ],
  virabrequim: [
    'RETÍFICA BB-BC',
    'POLIR',
    'DESEMPENAR',
    'TESTE DE TRINCA'
  ],
  eixo_comando: [
    'RETIFICAR',
    'POLIR'
  ],
  biela: [
    'RETIFICA BUCHA DE BIELA',
    'RETIFICA DE AÇO DE BIELA',
    'MUDAR PISTÃO',
    'MEDIR AÇO DE BIELA'
  ],
  montagem: [
    'TOTAL',
    'PARCIAL',
    'IN-LOCO'
  ],
  dinamometro: [
    'POTÊNCIA',
    'TORQUE',
    'CONSUMO'
  ],
  lavagem: [
    'PREPARAÇÃO',
    'LAVAGEM QUÍMICA',
    'LAVAGEM MANUAL',
    'SECAGEM'
  ],
  inspecao_inicial: [
    'VERIFICAÇÃO VISUAL',
    'MEDIÇÃO DE COMPONENTES',
    'IDENTIFICAÇÃO DE DEFEITOS',
    'REGISTRO FOTOGRÁFICO'
  ],
  inspecao_final: [
    'VERIFICAÇÃO DE MONTAGEM',
    'TESTES DE QUALIDADE',
    'VALIDAÇÃO FINAL',
    'RELATÓRIO DE ENTREGA'
  ]
};

// Mapeamento de etapas para ícones e nomes amigáveis
const ETAPAS_CONFIG = {
  lavagem: {
    icon: <Droplet className="h-4 w-4 mr-2" />,
    label: "Lavagem"
  },
  inspecao_inicial: {
    icon: <Search className="h-4 w-4 mr-2" />,
    label: "Inspeção Inicial"
  },
  inspecao_final: {
    icon: <FileSearch className="h-4 w-4 mr-2" />,
    label: "Inspeção Final"
  }
};

const formSchema = z.object({
  id: z.string().min(1, { message: "Número da OS é obrigatório" }),
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  clienteId: z.string({ required_error: "Selecione um cliente" }),
  motorId: z.string().optional(),
  dataAbertura: z.date({ required_error: "Selecione a data de abertura" }),
  dataPrevistaEntrega: z.date({ required_error: "Selecione a data prevista para entrega" }),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"] as const),
  servicosTipos: z.array(z.string()).optional(),
  servicosDescricoes: z.record(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type OrdemFormProps = {
  onSubmit: (values: FormValues & { fotosEntrada: File[], fotosSaida: File[] }) => void;
  isLoading?: boolean;
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
  clientes?: Cliente[];
  allMotores?: Motor[]; // Add all motors from the Motores list
  isLoadingClientes?: boolean;
};

const tiposServico: { value: TipoServico; label: string }[] = [
  { value: "lavagem", label: "Lavagem" },
  { value: "inspecao_inicial", label: "Inspeção Inicial" },
  { value: "bloco", label: "Bloco" },
  { value: "biela", label: "Biela" },
  { value: "cabecote", label: "Cabeçote" },
  { value: "virabrequim", label: "Virabrequim" },
  { value: "eixo_comando", label: "Eixo de Comando" },
  { value: "montagem", label: "Montagem" },
  { value: "dinamometro", label: "Dinamômetro" },
  { value: "inspecao_final", label: "Inspeção Final" }
];

export default function OrdemForm({ 
  onSubmit, 
  isLoading = false, 
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
  onCancel,
  clientes = [],
  allMotores = [], // New prop for all motors
  isLoadingClientes = false,
}: OrdemFormProps) {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("dados");
  const [selectedClienteId, setSelectedClienteId] = useState<string>(defaultValues?.clienteId || "");
  const [motores, setMotores] = useState<Motor[]>([]);
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false);
  const [isSubmittingCliente, setIsSubmittingCliente] = useState(false);
  const [isLoadingMotores, setIsLoadingMotores] = useState(false);
  const [clienteMotores, setClienteMotores] = useState<Motor[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: defaultValues?.id || "",
      nome: defaultValues?.nome || "",
      clienteId: defaultValues?.clienteId || "",
      motorId: defaultValues?.motorId || "",
      dataAbertura: defaultValues?.dataAbertura instanceof Date ? defaultValues.dataAbertura : new Date(),
      dataPrevistaEntrega: defaultValues?.dataPrevistaEntrega instanceof Date ? defaultValues.dataPrevistaEntrega : new Date(),
      prioridade: defaultValues?.prioridade || "media",
      servicosTipos: defaultValues?.servicosTipos || [],
      servicosDescricoes: defaultValues?.servicosDescricoes || {},
    },
  });
  
  useEffect(() => {
    if (defaultValues?.servicosDescricoes) {
      setServicosDescricoes(defaultValues.servicosDescricoes);
    }
  }, [defaultValues?.servicosDescricoes]);
  
  useEffect(() => {
    if (selectedClienteId) {
      setIsLoadingMotores(true);
      try {
        // Filter motors by selected client
        const clientMotors = allMotores.filter(motor => motor.clienteId === selectedClienteId);
        setClienteMotores(clientMotors);
      } catch (error) {
        console.error("Erro ao filtrar motores:", error);
        toast.error("Não foi possível filtrar os motores deste cliente");
        setClienteMotores([]);
      } finally {
        setIsLoadingMotores(false);
      }
    } else {
      setClienteMotores([]);
    }
  }, [selectedClienteId, allMotores]);
  
  useEffect(() => {
    const processDefaultFotos = () => {
      if (defaultFotosEntrada && defaultFotosEntrada.length > 0) {
        const processedFotos = defaultFotosEntrada.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosEntrada(processedFotos as any);
      }

      if (defaultFotosSaida && defaultFotosSaida.length > 0) {
        const processedFotos = defaultFotosSaida.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosSaida(processedFotos as any);
      }
    };

    processDefaultFotos();
  }, [defaultFotosEntrada, defaultFotosSaida]);
  
  const handleServicoDescricaoChange = (tipo: string, descricao: string) => {
    setServicosDescricoes(prev => ({
      ...prev,
      [tipo]: descricao
    }));
  };
  
  const handleFormSubmit = (values: FormValues) => {
    const formData = {
      ...values,
      servicosDescricoes,
      fotosEntrada,
      fotosSaida
    };
    
    onSubmit(formData);
  };
  
  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    form.setValue("motorId", "");
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
        
        onSubmit({ 
          ...form.getValues(), 
          clienteId: "",
          fotosEntrada: [],
          fotosSaida: []
        });
        
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs 
          defaultValue="dados" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="dados">Dados da OS</TabsTrigger>
            <TabsTrigger value="fotos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da OS</FormLabel>
                    <FormControl>
                      <Input placeholder="001/2023" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número ou identificador único da OS
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite aqui uma observação para a OS" {...field} />
                    </FormControl>
                    <FormDescription>
                      Observação para a OS
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                    disabled={!selectedClienteId || isLoadingMotores}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedClienteId 
                            ? "Selecione um cliente primeiro" 
                            : isLoadingMotores 
                              ? "Carregando motores..." 
                              : clienteMotores.length === 0 
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
                        clienteMotores.map((motor) => (
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="dataAbertura"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Abertura</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : undefined}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dataPrevistaEntrega"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Prevista de Entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : undefined}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel className="text-base">Serviços a serem realizados</FormLabel>
              <FormDescription className="mb-3">
                Selecione os serviços que serão executados nesta ordem
              </FormDescription>
              
              <div className="rounded-md border border-border p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="servicosTipos"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        {tiposServico.map((tipo) => (
                          <FormField
                            key={tipo.value}
                            control={form.control}
                            name="servicosTipos"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={tipo.value}
                                  className="flex flex-col space-y-3 my-4"
                                >
                                  <div className="flex items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(tipo.value)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), tipo.value]
                                            : field.value?.filter(
                                                (value) => value !== tipo.value
                                              ) || [];
                                          field.onChange(updatedValue);
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-normal">
                                        {tipo.label}
                                      </FormLabel>
                                    </div>
                                  </div>
                                  
                                  {field.value?.includes(tipo.value) && (
                                    <div className="ml-6">
                                      <Textarea
                                        placeholder={`Descreva o serviço de ${tipo.label.toLowerCase()}...`}
                                        value={servicosDescricoes[tipo.value] || ""}
                                        onChange={(e) => 
                                          handleServicoDescricaoChange(tipo.value, e.target.value)
                                        }
                                        className="resize-none"
                                        aria-label="Observação do serviço"
                                      />
                                    </div>
                                  )}
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="fotos" className="pt-4">
            <FotosForm 
              fotosEntrada={fotosEntrada}
              fotosSaida={fotosSaida}
              onChangeFotosEntrada={setFotosEntrada}
              onChangeFotosSaida={setFotosSaida}
            />
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel || (() => form.reset())}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-1">
                Salvando...
              </span>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </form>
      
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
    </Form>
  );
}
