
import { useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import ClienteForm from "@/components/clientes/ClienteForm";
import ClienteCard from "@/components/clientes/ClienteCard";
import ClienteDetalhes from "@/components/clientes/ClienteDetalhes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClientes } from "@/hooks/useClientes";
import { Cliente } from "@/types/clientes";
import { Plus, Search, CalendarIcon, Trophy, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ClientesProps {
  onLogout: () => void;
}

export default function Clientes({ onLogout }: ClientesProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState<Date | undefined>();
  const [periodoFim, setPeriodoFim] = useState<Date | undefined>();
  
  const {
    clientes,
    isLoading,
    createCliente,
    updateCliente,
    deleteCliente,
  } = useClientes();

  const handleSubmit = async (data: any) => {
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await createCliente(data);
        toast.success("Cliente criado com sucesso!");
      }
      setShowForm(false);
      setEditingCliente(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
      toast.success("Cliente excluído com sucesso!");
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error("Erro ao excluir cliente");
    }
  };

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetalhes(true);
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone?.includes(searchTerm);
    
    if (!periodoInicio && !periodoFim) return matchesSearch;
    
    if (!cliente.dataCriacao) return matchesSearch;
    
    const clienteDate = new Date(cliente.dataCriacao);
    const afterStart = !periodoInicio || clienteDate >= periodoInicio;
    const beforeEnd = !periodoFim || clienteDate <= periodoFim;
    
    return matchesSearch && afterStart && beforeEnd;
  });

  const rankingClientes = [...filteredClientes]
    .sort((a, b) => {
      // Ordenar por data de criação mais recente primeiro
      const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
      const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  const handleResetPeriodo = () => {
    setPeriodoInicio(undefined);
    setPeriodoFim(undefined);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e visualize estatísticas
            </p>
          </div>
          
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2 items-center">
                  <CalendarIcon className="h-4 w-4" />
                  {periodoInicio && periodoFim ? (
                    <>
                      {format(periodoInicio, "dd/MM/yyyy", { locale: ptBR })} - {format(periodoFim, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    <>Filtrar por período</>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="grid gap-2 p-4">
                  <div className="grid">
                    <div className="mb-2 font-medium">Data Inicial</div>
                    <Calendar
                      mode="single"
                      selected={periodoInicio}
                      onSelect={setPeriodoInicio}
                      initialFocus
                    />
                  </div>
                  <div className="grid">
                    <div className="mb-2 font-medium">Data Final</div>
                    <Calendar
                      mode="single"
                      selected={periodoFim}
                      onSelect={setPeriodoFim}
                      disabled={(date) => 
                        periodoInicio ? date < periodoInicio : false
                      }
                      initialFocus
                    />
                  </div>
                  <Button onClick={handleResetPeriodo} variant="outline" size="sm">
                    Limpar filtro
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de Clientes */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes ({filteredClientes.length})
                </CardTitle>
                <CardDescription>
                  Lista de todos os clientes cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showForm ? (
                  <ClienteForm
                    onSubmit={handleSubmit}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingCliente(null);
                    }}
                    initialData={editingCliente}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredClientes.map((cliente) => (
                      <ClienteCard
                        key={cliente.id}
                        cliente={cliente}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    ))}
                    
                    {filteredClientes.length === 0 && !isLoading && (
                      <div className="col-span-full text-center py-8">
                        <p className="text-muted-foreground">
                          {searchTerm || periodoInicio || periodoFim 
                            ? "Nenhum cliente encontrado com os filtros aplicados" 
                            : "Nenhum cliente cadastrado"
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Clientes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Ranking de Clientes
                </CardTitle>
                <CardDescription>
                  Clientes mais recentes
                  {(periodoInicio || periodoFim) && " (período filtrado)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rankingClientes.map((cliente, index) => (
                    <div key={cliente.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cliente.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {cliente.dataCriacao 
                            ? format(new Date(cliente.dataCriacao), "dd/MM/yyyy", { locale: ptBR })
                            : "Data não informada"
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {rankingClientes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum cliente encontrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ClienteDetalhes
        cliente={selectedCliente}
        isOpen={showDetalhes}
        onClose={() => {
          setShowDetalhes(false);
          setSelectedCliente(null);
        }}
        onEdit={(cliente) => {
          setShowDetalhes(false);
          handleEdit(cliente);
        }}
      />
    </Layout>
  );
}
