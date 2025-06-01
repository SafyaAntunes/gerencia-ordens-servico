
import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
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
import { SimpleServicoSelector } from "./SimpleServicoSelector";

interface OrdemFormProps {
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: any;
  clientes: Cliente[];
  allMotores?: Motor[];
  isLoadingClientes?: boolean;
}

const formSchema = z.object({
  id: z.string().min(3, {
    message: "Código da OS precisa ter ao menos 3 caracteres.",
  }),
  nome: z.string().min(3, {
    message: "Nome da OS precisa ter ao menos 3 caracteres.",
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
  isLoadingClientes = false
}: OrdemFormProps) {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [servicos, setServicos] = useState<string[]>([]);
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || generateId(),
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
    }
  });
  
  const { watch, setValue } = form;
  const values = watch();
  
  useEffect(() => {
    if (values.clienteId) {
      const cliente = clientes.find(c => c.id === values.clienteId);
      setSelectedCliente(cliente || null);
    } else {
      setSelectedCliente(null);
    }
  }, [values.clienteId, clientes]);
  
  useEffect(() => {
    if (initialData?.servicos) {
      const initialServicos = initialData.servicos.map((servico: any) => servico.tipo);
      const initialDescricoes = initialData.servicos.reduce((acc: any, servico: any) => {
        acc[servico.tipo] = servico.descricao || '';
        return acc;
      }, {});
      
      setServicos(initialServicos);
      setServicosDescricoes(initialDescricoes);
    }
  }, [initialData?.servicos]);
  
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
  
  const handleDescricaoChange = (tipo: string, descricao: string) => {
    const newDescricoes = { ...servicosDescricoes, [tipo]: descricao };
    setServicosDescricoes(newDescricoes);
    setValue("servicosDescricoes", newDescricoes);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                <FormLabel>Nome da OS</FormLabel>
                <FormControl>
                  <Input placeholder="Retífica do motor X" {...field} />
                </FormControl>
                <FormDescription>
                  Um nome descritivo para fácil identificação.
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
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  A data em que a ordem de serviço foi aberta.
                </FormDescription>
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
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  A data prevista para a entrega do serviço.
                </FormDescription>
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
              <FormDescription>
                O nível de prioridade desta ordem de serviço.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Serviços Simplificados */}
        <div>
          <FormLabel>Serviços</FormLabel>
          <FormDescription>
            Selecione os serviços a serem realizados. A atribuição de funcionários e controle detalhado será feita na página de detalhes da ordem.
          </FormDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {TIPOS_SERVICO.map((tipo) => (
              <SimpleServicoSelector
                key={tipo}
                tipo={tipo}
                isSelected={servicos.includes(tipo)}
                descricao={servicosDescricoes[tipo] || ''}
                onToggle={handleServicoToggle}
                onDescricaoChange={handleDescricaoChange}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function generateId() {
  return "OS-" + Math.random().toString(36).substring(2, 15).toUpperCase();
}
