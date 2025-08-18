
import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Prioridade, TipoServico } from "@/types/ordens";
import { Cliente } from "@/types/clientes";
import { Motor } from "@/types/motor";
import { ServicosSelector } from "./ServicosSelector";
import { FormSection } from "./FormSection";
import FotosForm from "./FotosForm";
import { MotorSelector } from '@/components/motores/MotorSelector';
import { FileText, User, CalendarDays, Settings, Camera, Car } from "lucide-react";

interface OrdemFormProps {
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: any;
  clientes: Cliente[];
  allMotores?: Motor[];
  isLoadingClientes?: boolean;
  showPhotos?: boolean;
}

const formSchema = z.object({
  id: z.string().min(3, {
    message: "Código da OS precisa ter ao menos 3 caracteres.",
  }),
  nome: z.string().min(3, {
    message: "Observação precisa ter ao menos 3 caracteres.",
  }),
  clienteId: z.string().min(3, {
    message: "Selecione um cliente.",
  }),
  motorId: z.string().optional(),
  dataAbertura: z.date(),
  dataPrevistaEntrega: z.date(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
  servicosTipos: z.array(z.string()).optional(),
  servicosDescricoes: z.record(z.string(), z.string()).optional(),
  fotosEntrada: z.array(z.any()).optional(),
  fotosSaida: z.array(z.any()).optional(),
});

// Lista dos tipos de serviços disponíveis
const TIPOS_SERVICO = [
  'bloco',
  'biela', 
  'cabecote',
  'virabrequim',
  'eixo_comando',
  'montagem',
  'dinamometro',
  'lavagem',
  'inspecao_inicial',
  'inspecao_final'
];

export default function OrdemForm({
  onSubmit,
  onCancel,
  isLoading,
  initialData,
  clientes,
  allMotores = [],
  isLoadingClientes = false,
  showPhotos = true
}: OrdemFormProps) {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedMotorId, setSelectedMotorId] = useState<string>("");
  const [servicos, setServicos] = useState<string[]>([]);
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [fotosEntrada, setFotosEntrada] = useState<any[]>([]);
  const [fotosSaida, setFotosSaida] = useState<any[]>([]);
  
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || "",
      nome: initialData?.nome || "",
      clienteId: initialData?.cliente?.id || "",
      motorId: initialData?.motorId || "",
      dataAbertura: initialData?.dataAbertura ? new Date(initialData.dataAbertura) : new Date(),
      dataPrevistaEntrega: initialData?.dataPrevistaEntrega ? new Date(initialData.dataPrevistaEntrega) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      prioridade: initialData?.prioridade || "media",
      servicosTipos: initialData?.servicos?.map((servico: any) => servico.tipo) || [],
      servicosDescricoes: initialData?.servicos?.reduce((acc: any, servico: any) => {
        acc[servico.tipo] = servico.descricao;
        return acc;
      }, {}) || {},
      fotosEntrada: initialData?.fotosEntrada || [],
      fotosSaida: initialData?.fotosSaida || [],
    }
  });
  
  const { watch, setValue } = form;
  const values = watch();
  
  useEffect(() => {
    if (values.clienteId) {
      const cliente = clientes.find(c => c.id === values.clienteId);
      setSelectedCliente(cliente || null);
      // Reset motor selection when client changes
      if (selectedCliente?.id !== values.clienteId) {
        setSelectedMotorId("");
        setValue("motorId", "");
      }
    } else {
      setSelectedCliente(null);
      setSelectedMotorId("");
      setValue("motorId", "");
    }
  }, [values.clienteId, clientes]);
  
  useEffect(() => {
    if (initialData?.motorId) {
      setSelectedMotorId(initialData.motorId);
      setValue("motorId", initialData.motorId);
    }
    
    if (initialData?.servicos) {
      const initialServicos = initialData.servicos.map((servico: any) => servico.tipo);
      const initialDescricoes = initialData.servicos.reduce((acc: any, servico: any) => {
        acc[servico.tipo] = servico.descricao || '';
        return acc;
      }, {});
      
      setServicos(initialServicos);
      setServicosDescricoes(initialDescricoes);
      setValue("servicosTipos", initialServicos);
      setValue("servicosDescricoes", initialDescricoes);
    }
    
    if (initialData?.fotosEntrada) {
      setFotosEntrada(initialData.fotosEntrada);
      setValue("fotosEntrada", initialData.fotosEntrada);
    }
    
    if (initialData?.fotosSaida) {
      setFotosSaida(initialData.fotosSaida);
      setValue("fotosSaida", initialData.fotosSaida);
    }
  }, [initialData, setValue]);
  
  const handleServicoToggle = (tipo: string, checked: boolean) => {
    let newServicos = [...servicos];
    
    if (checked) {
      if (!newServicos.includes(tipo)) {
        newServicos.push(tipo);
      }
    } else {
      newServicos = newServicos.filter(s => s !== tipo);
      // Remove descrição quando desmarcar serviço
      const newDescricoes = { ...servicosDescricoes };
      delete newDescricoes[tipo];
      setServicosDescricoes(newDescricoes);
      setValue("servicosDescricoes", newDescricoes);
    }
    
    setServicos(newServicos);
    setValue("servicosTipos", newServicos);
  };
  
  const handleMotorSelect = (motorId: string) => {
    setSelectedMotorId(motorId);
    setValue("motorId", motorId);
  };

  const handleDescricaoChange = (tipo: string, descricao: string) => {
    const newDescricoes = { ...servicosDescricoes, [tipo]: descricao };
    setServicosDescricoes(newDescricoes);
    setValue("servicosDescricoes", newDescricoes);
  };

  const handleFotosEntradaChange = (fotos: any[]) => {
    setFotosEntrada(fotos);
    setValue("fotosEntrada", fotos);
  };

  const handleFotosSaidaChange = (fotos: any[]) => {
    setFotosSaida(fotos);
    setValue("fotosSaida", fotos);
  };

  const handleFormSubmit = (values: any) => {
    // Incluir fotos nos dados do formulário
    const dataWithPhotos = {
      ...values,
      fotosEntrada,
      fotosSaida
    };
    onSubmit(dataWithPhotos);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        
        {/* Informações Básicas */}
        <FormSection
          title="Informações Básicas"
          description="Dados principais da ordem de serviço"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da OS</FormLabel>
                  <FormControl>
                    <Input placeholder="OS-2024-001" {...field} disabled={initialData?.id} />
                  </FormControl>
                  <FormDescription>
                    Este é o código único da ordem de serviço.
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
                    <Input placeholder="Retífica do motor X" {...field} />
                  </FormControl>
                  <FormDescription>
                    Uma observação descritiva para fácil identificação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Cliente */}
        <FormSection
          title="Cliente"
          description="Selecione o cliente responsável"
          icon={<User className="h-5 w-5" />}
        >
          <FormField
            control={form.control}
            name="clienteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  O cliente associado a esta ordem de serviço.
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
                <FormLabel>Motor (Opcional)</FormLabel>
                <FormControl>
                  <MotorSelector
                    selectedCliente={selectedCliente}
                    selectedMotorId={selectedMotorId}
                    onMotorSelect={handleMotorSelect}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Selecione o motor associado a esta ordem de serviço.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Datas e Prioridade */}
        <FormSection
          title="Cronograma"
          description="Defina as datas e prioridade do serviço"
          icon={<CalendarDays className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
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
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
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
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
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
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="prioridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </FormSection>

        {/* Serviços */}
        <FormSection
          title="Serviços"
          description="Selecione os serviços a serem realizados"
          icon={<Settings className="h-5 w-5" />}
        >
          <ServicosSelector
            servicosSelecionados={servicos}
            servicosDescricoes={servicosDescricoes}
            onToggleServico={handleServicoToggle}
            onChangeDescricao={handleDescricaoChange}
          />
        </FormSection>

        {/* Fotos */}
        {showPhotos && (
          <FormSection
            title="Fotos"
            description="Adicione fotos de entrada e saída (opcional)"
            icon={<Camera className="h-5 w-5" />}
            collapsible={true}
            defaultOpen={false}
          >
            <FotosForm
              fotosEntrada={fotosEntrada}
              fotosSaida={fotosSaida}
              onChangeFotosEntrada={handleFotosEntradaChange}
              onChangeFotosSaida={handleFotosSaidaChange}
              ordemId="temp"
            />
          </FormSection>
        )}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Criar Ordem de Serviço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function generateId() {
  return "OS-" + Math.random().toString(36).substring(2, 15).toUpperCase();
}
