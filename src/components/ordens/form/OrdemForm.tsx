
import { useState, useMemo, useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Camera } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import FotosForm from "@/components/ordens/FotosForm";
import { useOrdemFormData } from "./hooks";
import { 
  BasicInfoFields, 
  ClienteMotorSelector, 
  DatePickerField, 
  FormButtons, 
  PrioridadeSelector, 
  ServicoTipoSelector 
} from "./components";
import { formSchema, FormValues, OrdemFormProps } from "./types";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";

export const OrdemForm = ({ 
  onSubmit, 
  isLoading = false, 
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
  onCancel,
  clientes = [],
  isLoadingClientes = false,
  onSubatividadeToggle,
  isSubatividadeEditingEnabled = false,
}: OrdemFormProps) => {
  const [activeTab, setActiveTab] = useState("dados");
  const [selectedClienteId, setSelectedClienteId] = useState<string>(defaultValues?.clienteId || "");
  
  // Depuração: Verificar os valores iniciais de subatividades
  useEffect(() => {
    if (defaultValues?.servicosSubatividades) {
      console.log("🔍 [OrdemForm] Inicializando com subatividades:", defaultValues.servicosSubatividades);
      
      // Verificar se as subatividades foram passadas corretamente
      Object.entries(defaultValues.servicosSubatividades).forEach(([tipo, subs]) => {
        console.log(`🔍 [OrdemForm] Tipo ${tipo}:`, 
          Array.isArray(subs) ? `${subs.length} subatividades` : "formato inválido");
        
        if (Array.isArray(subs) && subs.length > 0) {
          console.log(`🔍 [OrdemForm] Amostra de subatividades para ${tipo}:`, 
            subs.slice(0, 2).map(s => ({
              id: s.id,
              nome: s.nome,
              selecionada: s.selecionada
            }))
          );
        }
      });
    } else {
      console.log("⚠️ [OrdemForm] Sem subatividades iniciais");
    }
  }, [defaultValues?.servicosSubatividades]);
  
  // Initialize form with schema validation
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
      servicosSubatividades: defaultValues?.servicosSubatividades || {},
      etapasTempoPreco: defaultValues?.etapasTempoPreco || {},
    },
  });
  
  // Watch service types to trigger side effects
  const servicosTipos = form.watch("servicosTipos") || [];
  
  // Use the refactored hook for form data handling
  const { 
    servicosDescricoes, 
    servicosSubatividades, 
    loadingSources,
    fotosEntrada, 
    fotosSaida, 
    etapasTempoPreco, 
    setFotosEntrada, 
    setFotosSaida, 
    handleServicoDescricaoChange, 
    handleSubatividadesChange,
    handleEtapaTempoPrecoChange 
  } = useOrdemFormData({
    servicosTipos,
    defaultValues,
    defaultFotosEntrada,
    defaultFotosSaida
  });
  
  // Access the default subatividades
  const { defaultSubatividades } = useServicoSubatividades();
  
  // Memoize the subatividades change handler
  const memoizedSubatividadesChange = useCallback((tipo: TipoServico, subatividades: SubAtividade[]) => {
    console.log("Changing subatividades for", tipo, subatividades);
    handleSubatividadesChange(tipo, subatividades);
  }, [handleSubatividadesChange]);
  
  const handleFormSubmit = useCallback((values: FormValues) => {
    const formData = {
      ...values,
      servicosDescricoes,
      servicosSubatividades,
      etapasTempoPreco,
      fotosEntrada,
      fotosSaida
    };
    
    onSubmit(formData);
  }, [
    servicosDescricoes, 
    servicosSubatividades, 
    etapasTempoPreco, 
    fotosEntrada, 
    fotosSaida, 
    onSubmit
  ]);
  
  // Memoize the cliente change handler
  const handleClienteChange = useCallback((clienteId: string) => {
    setSelectedClienteId(clienteId);
  }, []);

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
            <BasicInfoFields form={form} />
            
            <ClienteMotorSelector 
              form={form} 
              clientes={clientes} 
              isLoadingClientes={isLoadingClientes} 
              onClienteChange={handleClienteChange} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DatePickerField 
                form={form} 
                name="dataAbertura" 
                label="Data de Abertura" 
              />
              
              <DatePickerField 
                form={form} 
                name="dataPrevistaEntrega" 
                label="Data Prevista de Entrega" 
              />
              
              <PrioridadeSelector form={form} />
            </div>
            
            <ServicoTipoSelector 
              form={form} 
              servicosSubatividades={servicosSubatividades} 
              onSubatividadesChange={memoizedSubatividadesChange}
              loadingSources={loadingSources}
            />
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
        
        <FormButtons isLoading={isLoading} onCancel={onCancel} />
      </form>
    </Form>
  );
};
