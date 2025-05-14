
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

export const OrdemForm = ({ 
  onSubmit, 
  isLoading = false, 
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
  onCancel,
  clientes = [],
  isLoadingClientes = false,
}: OrdemFormProps) => {
  const [activeTab, setActiveTab] = useState("dados");
  const [selectedClienteId, setSelectedClienteId] = useState<string>(defaultValues?.clienteId || "");
  
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
      etapasTempoPreco: defaultValues?.etapasTempoPreco || {},
    },
  });
  
  // Watch service types to trigger side effects
  const servicosTipos = form.watch("servicosTipos") || [];
  
  // Use the refactored hook for form data handling
  const { 
    servicosDescricoes, 
    fotosEntrada, 
    fotosSaida, 
    etapasTempoPreco, 
    setFotosEntrada, 
    setFotosSaida, 
    handleServicoDescricaoChange,
    handleEtapaTempoPrecoChange 
  } = useOrdemFormData({
    servicosTipos,
    defaultValues,
    defaultFotosEntrada,
    defaultFotosSaida
  });
  
  const handleFormSubmit = useCallback((values: FormValues) => {
    const formData = {
      ...values,
      servicosDescricoes,
      etapasTempoPreco,
      fotosEntrada,
      fotosSaida,
      // Removida a inclusão de subatividades no submit do formulário
      // Agora as subatividades serão adicionadas apenas pelo tracker
    };
    
    onSubmit(formData);
  }, [
    servicosDescricoes, 
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
              onServicoDescricaoChange={handleServicoDescricaoChange}
              servicosDescricoes={servicosDescricoes}
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
