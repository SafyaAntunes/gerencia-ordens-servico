import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface AgendaProps extends LogoutProps {}

interface EventoOS {
  id: string;
  title: string;
  date: Date;
  type: "entrega" | "recebimento" | "manutencao" | "reuniao";
  status: string;
  ordemId: string;
}

interface NovoEventoFormValues {
  titulo: string;
  data: string;
  hora: string;
  tipo: "entrega" | "recebimento" | "manutencao" | "reuniao";
  ordemId?: string;
}

const Agenda = ({ onLogout }: AgendaProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [eventos, setEventos] = useState<EventoOS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [novoEventoAberto, setNovoEventoAberto] = useState(false);
  
  const form = useForm<NovoEventoFormValues>({
    defaultValues: {
      titulo: "",
      data: new Date().toISOString().split('T')[0],
      hora: "09:00",
      tipo: "reuniao"
    }
  });
  
  useEffect(() => {
    const fetchOrdens = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "ordens_servico"), 
          orderBy("dataAbertura", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const eventosTemp: EventoOS[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const ordem = {
            ...data,
            id: doc.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          } as OrdemServico;
          
          eventosTemp.push({
            id: `entrega-${ordem.id}`,
            title: `Entrega - ${ordem.nome || 'Sem nome'}`,
            date: new Date(ordem.dataPrevistaEntrega),
            type: "entrega",
            status: ordem.status || 'pendente',
            ordemId: ordem.id
          });
          
          eventosTemp.push({
            id: `recebimento-${ordem.id}`,
            title: `Recebimento - ${ordem.nome || 'Sem nome'}`,
            date: new Date(ordem.dataAbertura),
            type: "recebimento",
            status: ordem.status || 'pendente',
            ordemId: ordem.id
          });
        });
        
        setEventos(eventosTemp);
      } catch (error) {
        console.error("Erro ao buscar ordens:", error);
        toast.error("Falha ao carregar eventos do calendário");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  const handlePrevious = () => {
    if (date) {
      const newDate = new Date(date);
      if (view === "day") {
        newDate.setDate(newDate.getDate() - 1);
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setDate(newDate);
    }
  };
  
  const handleNext = () => {
    if (date) {
      const newDate = new Date(date);
      if (view === "day") {
        newDate.setDate(newDate.getDate() + 1);
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setDate(newDate);
    }
  };
  
  const handleToday = () => {
    setDate(new Date());
  };
  
  const formatDateRange = () => {
    if (!date) return "";
    
    if (view === "day") {
      return new Intl.DateTimeFormat('pt-BR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } else if (view === "week") {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startFormatted = new Intl.DateTimeFormat('pt-BR', { 
        day: 'numeric', 
        month: 'short'
      }).format(startOfWeek);
      
      const endFormatted = new Intl.DateTimeFormat('pt-BR', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      }).format(endOfWeek);
      
      return `${startFormatted} - ${endFormatted}`;
    } else {
      return new Intl.DateTimeFormat('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    }
  };
  
  const getEventsByDate = (day: Date) => {
    return eventos.filter(event => 
      event.date.getDate() === day.getDate() &&
      event.date.getMonth() === day.getMonth() &&
      event.date.getFullYear() === day.getFullYear()
    );
  };
  
  const getEventColor = (type: string, status: string) => {
    if (status === "entregue") {
      return "bg-gray-100 text-gray-500 border-gray-300";
    }
    
    switch (type) {
      case "entrega":
        return "bg-green-100 text-green-800 border-green-300";
      case "recebimento":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "manutencao":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "reuniao":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  const isEntregue = (event: EventoOS) => event.status === "entregue";

  const renderDayContents = (day: Date) => {
    const dayEvents = getEventsByDate(day);
    
    return (
      <div className="relative flex flex-col items-center justify-center h-full w-full">
        <span className="absolute top-0.5 left-0.5">{day.getDate()}</span>
        
        {dayEvents.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex space-x-0.5 mt-1">
                    {dayEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          event.type === "entrega"
                            ? "bg-green-500"
                            : event.type === "recebimento"
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                        }`}
                      />
                    )).slice(0, 3)}
                    {dayEvents.length > 3 && (
                      <span className="text-[0.6rem] text-muted-foreground">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" className="p-1">
                  <div className="text-xs p-1">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id} 
                        className={`py-0.5 px-1 mb-1 rounded ${getEventColor(event.type, event.status)}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    );
  };
  
  const handleNovoEvento = () => {
    setNovoEventoAberto(true);
    
    if (date) {
      form.setValue('data', date.toISOString().split('T')[0]);
    }
  };
  
  const onSubmitNovoEvento = (values: NovoEventoFormValues) => {
    try {
      const dataEvento = new Date(`${values.data}T${values.hora}`);
      
      const novoEvento: EventoOS = {
        id: `manual-${Date.now()}`,
        title: values.titulo,
        date: dataEvento,
        type: values.tipo,
        status: "pendente",
        ordemId: values.ordemId || ""
      };
      
      setEventos([...eventos, novoEvento]);
      setNovoEventoAberto(false);
      toast.success("Evento adicionado com sucesso!");
      form.reset();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao criar evento");
    }
  };
  
  if (isLoading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-full">
          <p>Carregando dados da agenda...</p>
        </div>
      </Layout>
    );
  }
  
  const getMonthName = (month: number) => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month];
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie compromissos, entregas e recebimentos
            </p>
          </div>
          
          <Button onClick={handleNovoEvento}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleToday}>
                    Hoje
                  </Button>
                  <h2 className="text-xl font-semibold">{formatDateRange()}</h2>
                </div>
                
                <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")}>
                  <TabsList>
                    <TabsTrigger value="day">Dia</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="mt-4">
                <Tabs value={view} className="mt-0">
                  <TabsContent value="month" className="flex justify-center">
                    <div className="w-full max-w-4xl">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="border rounded-md w-full max-h-[600px] mx-auto"
                        components={{
                          Day: (props) => {
                            const { date: dayDate, ...rest } = props;
                            if (!dayDate) return null;
                            return <div {...rest}>{renderDayContents(dayDate)}</div>;
                          }
                        }}
                        modifiers={{
                          event: (date) => getEventsByDate(date).length > 0,
                        }}
                        modifiersClassNames={{
                          event: "",
                        }}
                        fromMonth={new Date(2023, 0)}
                        toMonth={new Date(2025, 11)}
                        formatters={{
                          formatMonthCaption: (date) => getMonthName(date.getMonth()) + ' ' + date.getFullYear(),
                        }}
                        styles={{
                          months: { fontSize: '1rem' },
                          caption: { fontSize: '1.25rem' },
                          cell: { width: '3.5rem', height: '3.5rem' },
                          day: { width: '3.5rem', height: '3.5rem', fontSize: '1rem' }
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="day">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-4">Eventos do dia</h3>
                      {date && getEventsByDate(date).length > 0 ? (
                        <div className="space-y-3">
                          {getEventsByDate(date).map((event) => (
                            <div 
                              key={event.id}
                              className={`p-3 rounded-md border ${getEventColor(event.type, event.status)}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className={`font-medium ${isEntregue(event) ? 'line-through' : ''}`}>
                                    {event.title}
                                  </p>
                                  <p className="text-sm">
                                    {event.date.toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                    {isEntregue(event) && (
                                      <span className="ml-2 text-green-600">Concluído</span>
                                    )}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm">Detalhes</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="mx-auto h-12 w-12 mb-2 opacity-30" />
                          <p>Nenhum evento para este dia</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="week">
                    <div className="border rounded-md">
                      <div className="grid grid-cols-7 gap-px bg-muted">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                          <div key={day} className="bg-background p-2 text-center font-medium">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-px bg-muted">
                        {Array.from({ length: 7 }).map((_, i) => {
                          const dayDate = new Date(date || new Date());
                          dayDate.setDate(dayDate.getDate() - dayDate.getDay() + i);
                          const dayEvents = getEventsByDate(dayDate);
                          
                          return (
                            <div key={i} className="bg-background p-2 min-h-[120px]">
                              <div className="font-medium text-sm mb-1">
                                {dayDate.getDate()}
                              </div>
                              <div className="space-y-1">
                                {dayEvents.map((event) => (
                                  <div 
                                    key={event.id}
                                    className={`text-xs p-1 rounded truncate ${getEventColor(event.type, event.status)}`}
                                  >
                                    <span className={isEntregue(event) ? 'line-through' : ''}>
                                      {event.date.toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })} - {event.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={novoEventoAberto} onOpenChange={setNovoEventoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Evento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do evento para adicioná-lo à agenda.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitNovoEvento)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título do evento" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="entrega">Entrega</SelectItem>
                        <SelectItem value="recebimento">Recebimento</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNovoEventoAberto(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Agenda;
