
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Trash2, X, Camera } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Prioridade, TipoServico } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FotosForm from "./FotosForm";

const CLIENTES = [
  { id: "1", nome: "Auto Peças Silva" },
  { id: "2", nome: "Oficina Mecânica Central" },
  { id: "3", nome: "Concessionária Motors" },
  { id: "4", nome: "Autoelétrica Express" },
  { id: "5", nome: "Transportadora Rodovia" },
];

const formSchema = z.object({
  numero: z.string().min(2, { message: "Número da OS deve ter pelo menos 2 caracteres" }),
  descricaoServico: z.string().min(2, { message: "Descrição deve ter pelo menos 2 caracteres" }),
  tipoMotor: z.string().min(2, { message: "Tipo de motor é obrigatório" }),
  modelo: z.string().min(2, { message: "Modelo é obrigatório" }),
  combustivel: z.string().min(2, { message: "Combustível é obrigatório" }),
  clienteId: z.string({ required_error: "Selecione um cliente" }),
  dataAbertura: z.date({ required_error: "Selecione a data de abertura" }),
  dataPrevistaEntrega: z.date({ required_error: "Selecione a data prevista para entrega" }),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"] as const),
  servicosTipos: z.array(z.string()).min(1, { message: "Selecione pelo menos um serviço" }),
});

type FormValues = z.infer<typeof formSchema>;

type OrdemFormProps = {
  onSubmit: (values: FormValues & { fotosEntrada: File[], fotosSaida: File[] }) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: File[];
  defaultFotosSaida?: File[];
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
  onDelete,
  isLoading = false, 
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
}: OrdemFormProps) {
  const [fotosEntrada, setFotosEntrada] = useState<File[]>(defaultFotosEntrada);
  const [fotosSaida, setFotosSaida] = useState<File[]>(defaultFotosSaida);
  const [activeTab, setActiveTab] = useState("dados");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: defaultValues?.numero || "",
      descricaoServico: defaultValues?.descricaoServico || "",
      tipoMotor: defaultValues?.tipoMotor || "",
      modelo: defaultValues?.modelo || "",
      combustivel: defaultValues?.combustivel || "",
      clienteId: defaultValues?.clienteId || "",
      dataAbertura: defaultValues?.dataAbertura || new Date(),
      dataPrevistaEntrega: defaultValues?.dataPrevistaEntrega || new Date(),
      prioridade: defaultValues?.prioridade || "media",
      servicosTipos: defaultValues?.servicosTipos || [],
    },
  });
  
  const handleFormSubmit = (values: FormValues) => {
    const formData = {
      ...values,
      fotosEntrada,
      fotosSaida
    };
    
    onSubmit(formData);
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
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da OS</FormLabel>
                    <FormControl>
                      <Input placeholder="OS-2023-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número de identificação da OS
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="descricaoServico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Serviço</FormLabel>
                    <FormControl>
                      <Input placeholder="Retífica de motor completa" {...field} />
                    </FormControl>
                    <FormDescription>
                      Descrição breve do serviço
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="tipoMotor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Motor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fire 1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fiat Uno 2018" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="combustivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gasolina">Gasolina</SelectItem>
                        <SelectItem value="etanol">Etanol</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="gnv">GNV</SelectItem>
                      </SelectContent>
                    </Select>
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
                    onValueChange={field.onChange} 
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
                                  className="flex items-start space-x-3 space-y-0 my-4"
                                >
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
        
        <div className="flex justify-between gap-3">
          {onDelete && (
            <Button 
              type="button" 
              variant="destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir OS
            </Button>
          )}
          
          <div className="flex gap-3 ml-auto">
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
        </div>
      </form>
    </Form>
  );
}
