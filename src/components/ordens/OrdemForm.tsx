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
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Prioridade, TipoServico, SubAtividade, TipoAtividade } from "@/types/ordens";
import { Cliente } from "@/types/clientes";
import { Motor } from "@/types/motor";
import { SimpleFuncionarioSelector } from "@/components/funcionarios/SimpleFuncionarioSelector";
import { useAuth } from "@/hooks/useAuth";
import { useOrdemValidation } from "@/hooks/useOrdemValidation";
import { arrayMove } from "@dnd-kit/sortable";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/sortable-item";
import { ServicoControl } from "./servico/ServicoControl";

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
  servicosSubatividades: z.record(z.string(), z.array(z.any())).optional(),
  atividadesEspecificas: z.record(z.string(), z.record(z.string(), z.array(z.any()))).optional(),
  fotosEntrada: z.array(z.any()).optional(),
  fotosSaida: z.array(z.any()).optional(),
  funcionarioId: z.string().optional(),
  funcionarioNome: z.string().optional(),
});

const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function generateId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `OS${timestamp}${random}`;
}

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
  const [filteredMotores, setFilteredMotores] = useState<Motor[]>([]);
  const [isAtribuirDialogOpen, setIsAtribuirDialogOpen] = useState(false);
  const [isReordenandoServicos, setIsReordenandoServicos] = useState(false);
  const [servicos, setServicos] = useState<string[]>([]);
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string | undefined>(initialData?.funcionarioId);
  const [selectedFuncionarioNome, setSelectedFuncionarioNome] = useState<string | undefined>(initialData?.funcionarioNome);
  const [idError, setIdError] = useState<string>("");
  
  const { funcionario: currentUser } = useAuth();
  const { validateOrdemId, isValidating } = useOrdemValidation();
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
      servicosSubatividades: initialData?.servicos?.reduce((acc: any, servico: any) => {
        acc[servico.tipo] = servico.subatividades;
        return acc;
      }, {}) || {},
      atividadesEspecificas: initialData?.atividadesEspecificas || {},
      fotosEntrada: initialData?.fotosEntrada || [],
      fotosSaida: initialData?.fotosSaida || [],
      funcionarioId: initialData?.funcionarioId || "",
      funcionarioNome: initialData?.funcionarioNome || "",
    }
  });
  
  const { watch, setValue } = form;
  const values = watch();

  // Validação de ID duplicado
  const validateIdField = async (id: string) => {
    if (!id || id.length < 3) {
      setIdError("");
      return;
    }

    const isValid = await validateOrdemId(id, initialData?.id);
    if (!isValid) {
      setIdError("Este número de OS já existe. Escolha outro número.");
    } else {
      setIdError("");
    }
  };

  useEffect(() => {
    if (values.clienteId) {
      const cliente = clientes.find(c => c.id === values.clienteId);
      setSelectedCliente(cliente || null);
    } else {
      setSelectedCliente(null);
    }
  }, [values.clienteId, clientes]);
  
  useEffect(() => {
    setFilteredMotores(allMotores || []);
  }, [allMotores]);
  
  useEffect(() => {
    if (initialData?.servicos) {
      const initialServicos = initialData.servicos.map((servico: any) => servico.tipo);
      setServicos(initialServicos);
    }
  }, [initialData?.servicos]);
  
  const handleServicoToggle = (tipo: string, checked: boolean) => {
    const currentServicos = form.getValues("servicosTipos") || [];
    let newServicos = [...currentServicos];
    
    if (checked) {
      newServicos.push(tipo);
    } else {
      newServicos = newServicos.filter(s => s !== tipo);
    }
    
    setValue("servicosTipos", newServicos);
    setServicos(newServicos);
  };
  
  const handleDescricaoChange = (tipo: string, descricao: string) => {
    const currentDescricoes = form.getValues("servicosDescricoes") || {};
    setValue("servicosDescricoes", { ...currentDescricoes, [tipo]: descricao });
  };
  
  const handleSubatividadeToggle = (servicoTipo: string, subatividadeId: string, checked: boolean) => {
    const currentSubatividades = form.getValues("servicosSubatividades") || {};
    const subatividades = currentSubatividades[servicoTipo] || [];
    
    let newSubatividades = [...subatividades];
    
    if (checked) {
      newSubatividades.push({ id: subatividadeId, selecionada: true });
    } else {
      newSubatividades = newSubatividades.filter((sub: any) => sub.id !== subatividadeId);
    }
    
    setValue("servicosSubatividades", { ...currentSubatividades, [servicoTipo]: newSubatividades });
  };

  const handleSubmitWithValidation = async (values: z.infer<typeof formSchema>) => {
    // Validar ID antes de submeter
    const isValidId = await validateOrdemId(values.id, initialData?.id);
    if (!isValidId) {
      setIdError("Este número de OS já existe. Escolha outro número.");
      return;
    }

    // Limpar erro se validação passou
    setIdError("");
    onSubmit(values);
  };

  const sensors = useSensors(
    useSensor(PointerSensor)
  );
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = servicos.indexOf(active.id as string);
    const newIndex = servicos.indexOf(over.id as string);
    
    const reorderedServicos = arrayMove(servicos, oldIndex, newIndex);
    
    setServicos(reorderedServicos);
    setValue("servicosTipos", reorderedServicos);
  }, [servicos, setValue]);
  
  const isFuncionarioAllowed = () => {
    return currentUser?.nivelPermissao === 'admin' || currentUser?.nivelPermissao === 'gerente';
  };
  
  // Convert TipoServico enum to an array of values
  const tipoServicoValues = Object.values(TipoServico);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitWithValidation)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da OS *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: OS240001" 
                      {...field} 
                      onBlur={(e) => validateIdField(e.target.value)}
                      className={idError ? "border-red-500" : ""}
                    />
                  </FormControl>
                  {idError && <p className="text-sm text-red-600">{idError}</p>}
                  {isValidating && <p className="text-sm text-gray-500">Verificando disponibilidade...</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da OS *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Retífica Motor Diesel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cliente e Motor */}
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
                  <FormLabel>Motor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um motor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allMotores.map((motor) => (
                        <SelectItem key={motor.id} value={motor.id}>
                          {motor.marca} - {motor.modelo} ({motor.numeroSerie || "Sem Nº de série"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    O motor que será trabalhado nesta ordem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Data Abertura e Data Prevista */}
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
          
          {/* Prioridade */}
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
          
          {/* Serviços */}
          <div>
            <FormLabel>Serviços</FormLabel>
            <FormDescription>
              Selecione os serviços a serem realizados nesta ordem.
            </FormDescription>
            
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={servicos}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {tipoServicoValues.map((tipo) => (
                    <SortableItem key={tipo} id={tipo}>
                      <div className="flex items-center justify-between rounded-md border p-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={tipo}
                            checked={servicos.includes(tipo)}
                            onCheckedChange={(checked) => handleServicoToggle(tipo, !!checked)}
                          />
                          <Label htmlFor={tipo} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {toTitleCase(tipo)}
                          </Label>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsReordenandoServicos(!isReordenandoServicos)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <line x1="3" x2="21" y1="4" y2="4" />
                            <line x1="3" x2="21" y1="12" y2="12" />
                            <line x1="3" x2="21" y1="20" y2="20" />
                          </svg>
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            <Separator className="my-4" />
            
            {values.servicosTipos && values.servicosTipos.length > 0 && (
              <div className="space-y-4">
                {values.servicosTipos.map((tipo: string) => (
                  <ServicoControl
                    key={tipo}
                    tipo={tipo as TipoServico}
                    form={form}
                    handleSubatividadeToggle={handleSubatividadeToggle}
                    handleAtividadeEspecificaToggle={handleAtividadeEspecificaToggle}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Funcionário */}
          <div>
            <FormLabel>Atribuir Funcionário</FormLabel>
            <FormDescription>
              Selecione o funcionário responsável por esta ordem de serviço.
            </FormDescription>
            
            <div className="flex items-center justify-between">
              <SimpleFuncionarioSelector
                especialidadeRequerida={values.servicosTipos && values.servicosTipos.length > 0 ? values.servicosTipos[0] as TipoServico : undefined}
                funcionarioAtualId={selectedFuncionarioId}
                funcionarioAtualNome={selectedFuncionarioNome}
                onFuncionarioSelecionado={(id, nome) => {
                  setValue("funcionarioId", id);
                  setValue("funcionarioNome", nome);
                  setSelectedFuncionarioId(id);
                  setSelectedFuncionarioNome(nome);
                }}
                onCancelar={handleLimparFuncionario}
                mostrarCancelar={!!values.funcionarioId}
                disabled={!isFuncionarioAllowed()}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isValidating || !!idError}
            >
              {isLoading ? "Salvando..." : "Salvar Ordem"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
