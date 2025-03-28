
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Plus, X, Camera } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Prioridade, TipoServico, Motor } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FotosForm from "./FotosForm";

const CLIENTES = [
  { id: "1", nome: "Auto Peças Silva" },
  { id: "2", nome: "Oficina Mecânica Central" },
  { id: "3", nome: "Concessionária Motors" },
  { id: "4", nome: "Autoelétrica Express" },
  { id: "5", nome: "Transportadora Rodovia" },
];

// Motores de exemplo para demonstração
const MOTORES: Record<string, Motor[]> = {
  "1": [
    { id: "101", marca: "Ford", modelo: "Zetec Rocam 1.0", numeroSerie: "ZR10-123456", ano: "2018" },
    { id: "102", marca: "Ford", modelo: "Zetec Rocam 1.6", numeroSerie: "ZR16-234567", ano: "2019" }
  ],
  "2": [
    { id: "201", marca: "Volkswagen", modelo: "EA111 1.0", numeroSerie: "EA111-345678", ano: "2018" },
    { id: "202", marca: "Volkswagen", modelo: "EA211 1.6", numeroSerie: "EA211-456789", ano: "2020" }
  ],
  "3": [
    { id: "301", marca: "Fiat", modelo: "Fire 1.0", numeroSerie: "FIRE-567890", ano: "2017" },
    { id: "302", marca: "Fiat", modelo: "E.torQ 1.6", numeroSerie: "ETORQ-678901", ano: "2018" }
  ],
  "4": [
    { id: "401", marca: "Chevrolet", modelo: "Econo.Flex 1.0", numeroSerie: "EFLEX-789012", ano: "2019" },
    { id: "402", marca: "Chevrolet", modelo: "Family 1.4", numeroSerie: "FAM-890123", ano: "2020" }
  ],
  "5": [
    { id: "501", marca: "Mercedes", modelo: "OM 366", numeroSerie: "OM366-901234", ano: "2017" },
    { id: "502", marca: "Scania", modelo: "DC13", numeroSerie: "DC13-012345", ano: "2018" }
  ]
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
};

const tiposServico: { value: TipoServico; label: string }[] = [
  { value: "bloco", label: "Bloco" },
  { value: "biela", label: "Biela" },
  { value: "cabecote", label: "Cabeçote" },
  { value: "virabrequim", label: "Virabrequim" },
  { value: "eixo_comando", label: "Eixo de Comando" },
];

export default function OrdemForm({ 
  onSubmit, 
  isLoading = false, 
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
}: OrdemFormProps) {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("dados");
  const [selectedClienteId, setSelectedClienteId] = useState<string>(defaultValues?.clienteId || "");
  const [motores, setMotores] = useState<Motor[]>([]);
  
  // Converter fotos de base64 para objetos para exibição
  useEffect(() => {
    const processDefaultFotos = () => {
      if (defaultFotosEntrada && defaultFotosEntrada.length > 0) {
        // As fotos já estão em formato utilizável
        const processedFotos = defaultFotosEntrada.map((foto: any) => {
          // Se for um objeto com propriedade data (formato base64)
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          // Se já for uma string base64
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
  
  // Carregar motores do cliente selecionado
  useEffect(() => {
    if (selectedClienteId) {
      // Em um cenário real, buscaríamos os motores do cliente no backend
      // Como estamos usando dados mockados, carregamos do objeto MOTORES
      const clienteMotores = MOTORES[selectedClienteId] || [];
      setMotores(clienteMotores);
    } else {
      setMotores([]);
    }
  }, [selectedClienteId]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: defaultValues?.id || "",
      nome: defaultValues?.nome || "",
      clienteId: defaultValues?.clienteId || "",
      motorId: defaultValues?.motorId || "",
      dataAbertura: defaultValues?.dataAbertura || new Date(),
      dataPrevistaEntrega: defaultValues?.dataPrevistaEntrega || new Date(),
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
    form.setValue("motorId", ""); // Resetar o motor selecionado ao mudar de cliente
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
                    <FormLabel>Nome da Ordem de Serviço</FormLabel>
                    <FormControl>
                      <Input placeholder="Motor Ford Ka 2019" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome ou identificação da OS
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
                  <FormLabel>Cliente</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleClienteChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CLIENTES.map((cliente) => (
                        <SelectItem 
                          key={cliente.id} 
                          value={cliente.id}
                        >
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Cliente vinculado à OS
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de seleção de motor */}
            <FormField
              control={form.control}
              name="motorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedClienteId || motores.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedClienteId 
                            ? "Selecione um cliente primeiro" 
                            : motores.length === 0 
                              ? "Nenhum motor cadastrado para este cliente" 
                              : "Selecione um motor"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {motores.map((motor) => (
                        <SelectItem 
                          key={motor.id} 
                          value={motor.id}
                        >
                          {motor.marca} {motor.modelo} - {motor.numeroSerie} ({motor.ano})
                        </SelectItem>
                      ))}
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
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
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
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
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
                      <SelectContent>
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
            onClick={() => form.reset()}
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
    </Form>
  );
}
