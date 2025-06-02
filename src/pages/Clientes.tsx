import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, Building, Phone, Mail, FilterX, Car, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Cliente } from "@/types/clientes";
import { getClientes, saveCliente, deleteCliente } from "@/services/clienteService";
import ClienteForm from "@/components/clientes/ClienteForm";
import ClienteCard from "@/components/clientes/ClienteCard";
import ClienteDetalhes from "@/components/clientes/ClienteDetalhes";
import { toast } from "sonner";
import ExportButton from "@/components/common/ExportButton";
import ImportButton from "@/components/common/ImportButton";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
import { Card, CardContent } from "@/components/ui/card";

interface ClientesProps {
  onLogout?: () => void;
}

interface ClienteRanking {
  clienteId: string;
  nome: string;
  email: string;
  telefone?: string;
  totalOrdens: number;
}

export default function Clientes({ onLogout }: ClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [clientesRanking, setClientesRanking] = useState<ClienteRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [activeTab, setActiveTab] = useState("cadastro");
  
  // Filtros do ranking
  const [filtroTipo, setFiltroTipo] = useState<"periodo" | "quantidade">("quantidade");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [quantidadeMinima, setQuantidadeMinima] = useState<number>(1);
  
  const navigate = useNavigate();

  // Fetch clientes on mount
  useEffect(() => {
    fetchClientes();
  }, []);
  
  // Fetch cliente ranking when active tab changes to ranking or filters change
  useEffect(() => {
    if (activeTab === "ranking") {
      fetchClientesRanking();
    }
  }, [activeTab, filtroTipo, dataInicio, dataFim, quantidadeMinima]);
  
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchClientesRanking = async () => {
    setLoadingRanking(true);
    try {
      // 1. Buscar todas as ordens de serviço
      const ordensRef = collection(db, 'ordens_servico');
      let ordensQuery = query(ordensRef);
      
      // Aplicar filtro por período se selecionado
      if (filtroTipo === "periodo" && dataInicio && dataFim) {
        const inicioTimestamp = Timestamp.fromDate(dataInicio);
        const fimTimestamp = Timestamp.fromDate(dataFim);
        ordensQuery = query(ordensRef, 
          where('dataAbertura', '>=', inicioTimestamp),
          where('dataAbertura', '<=', fimTimestamp)
        );
      }
      
      const ordensSnapshot = await getDocs(ordensQuery);
      
      // 2. Contar ordens por cliente
      const clientesCountMap = new Map<string, number>();
      const clientesInfoMap = new Map<string, { nome: string; email: string; telefone?: string }>();
      
      ordensSnapshot.forEach((doc) => {
        const ordem = doc.data() as Partial<OrdemServico>;
        
        if (ordem.cliente && ordem.cliente.id) {
          const clienteId = ordem.cliente.id;
          clientesCountMap.set(clienteId, (clientesCountMap.get(clienteId) || 0) + 1);
          
          if (!clientesInfoMap.has(clienteId) && ordem.cliente) {
            clientesInfoMap.set(clienteId, {
              nome: ordem.cliente.nome || '',
              email: ordem.cliente.email || '',
              telefone: ordem.cliente.telefone
            });
          }
        }
      });
      
      // 3. Criar ranking
      let ranking: ClienteRanking[] = Array.from(clientesCountMap.entries())
        .map(([clienteId, totalOrdens]) => {
          const info = clientesInfoMap.get(clienteId) || { nome: 'Cliente Desconhecido', email: '' };
          
          return {
            clienteId,
            nome: info.nome,
            email: info.email,
            telefone: info.telefone,
            totalOrdens
          };
        });
      
      // Aplicar filtro por quantidade mínima
      if (filtroTipo === "quantidade") {
        ranking = ranking.filter(cliente => cliente.totalOrdens >= quantidadeMinima);
      }
      
      // Ordenar por quantidade de ordens
      ranking.sort((a, b) => b.totalOrdens - a.totalOrdens);
      
      setClientesRanking(ranking);
    } catch (error) {
      console.error('Erro ao carregar ranking de clientes:', error);
      toast.error('Erro ao carregar ranking de clientes');
    } finally {
      setLoadingRanking(false);
    }
  };
  
  // Filter clientes based on search
  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm)
  );
  
  const handleOpenAddDialog = () => {
    setSelectedCliente(null);
    setIsDialogOpen(true);
  };
  
  const handleOpenEditDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDialogOpen(true);
  };
  
  const handleOpenDetailsDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDetalhesOpen(true);
  };
  
  const handleOpenDeleteDialog = (id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Prepare cliente object
      const clienteData: Cliente = selectedCliente
        ? { ...selectedCliente, ...values }
        : {
            id: "",
            ...values,
          };
      
      // Save cliente
      const success = await saveCliente(clienteData);
      
      if (success) {
        toast.success(
          selectedCliente
            ? "Cliente atualizado com sucesso!"
            : "Cliente cadastrado com sucesso!"
        );
        setIsDialogOpen(false);
        fetchClientes();
      }
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      const success = await deleteCliente(clienteToDelete);
      
      if (success) {
        toast.success("Cliente excluído com sucesso!");
        fetchClientes();
        setDeleteDialogOpen(false);
        setClienteToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleAdvancedEdit = (cliente: Cliente) => {
    navigate(`/clientes/editar/${cliente.id}`);
  };
  
  const handleImportClientes = async (data: any) => {
    if (!Array.isArray(data)) {
      toast.error('Formato inválido. Esperado uma lista de clientes.');
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    
    try {
      for (const clienteData of data) {
        // Verificar se o cliente tem dados mínimos necessários
        if (!clienteData.nome) {
          continue;
        }
        
        const cliente: Cliente = {
          id: '',  // ID será gerado no servidor
          ...clienteData,
        };
        
        const success = await saveCliente(cliente);
        if (success) successCount++;
      }
      
      toast.success(`${successCount} cliente(s) importado(s) com sucesso!`);
      fetchClientes();
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      toast.error('Erro ao importar clientes.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const validateClienteData = (data: any): boolean => {
    return Array.isArray(data) && data.some(item => !!item.nome);
  };
  
  const clearFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    setQuantidadeMinima(1);
    setFiltroTipo("quantidade");
  };
  
  const renderClientesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (filteredClientes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {searchTerm ? (
              <>
                Não encontramos nenhum cliente com o termo <strong>"{searchTerm}"</strong>. Tente ajustar a busca ou cadastre um novo cliente.
              </>
            ) : (
              "Comece adicionando seu primeiro cliente para poder criar ordens de serviço."
            )}
          </p>
          <Button className="mt-4" onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClientes.map((cliente) => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            onView={handleOpenDetailsDialog}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
          />
        ))}
      </div>
    );
  };
  
  const renderRanking = () => {
    if (loadingRanking) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (clientesRanking.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma OS encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Não encontramos ordens de serviço com os filtros aplicados.
          </p>
          <Button className="mt-4" variant="outline" onClick={clearFiltros}>
            Limpar Filtros
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {clientesRanking.map((cliente, index) => (
          <Card key={cliente.clienteId} className={index < 3 ? "border-primary" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    index === 0 ? "bg-yellow-100 text-yellow-700" : 
                    index === 1 ? "bg-gray-200 text-gray-700" : 
                    index === 2 ? "bg-amber-100 text-amber-700" : 
                    "bg-muted text-muted-foreground"
                  } font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{cliente.nome}</h3>
                    <div className="text-sm text-muted-foreground flex flex-col gap-1">
                      <div className="flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        {cliente.email}
                      </div>
                      {cliente.telefone && (
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          {cliente.telefone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{cliente.totalOrdens}</div>
                  <div className="text-xs text-muted-foreground">
                    {cliente.totalOrdens === 1 ? "ordem" : "ordens"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes da sua retífica
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <ImportButton 
              onImport={handleImportClientes} 
              validateData={validateClienteData}
              disabled={isSubmitting}
            />
            <ExportButton 
              data={clientes}
              fileName="clientes.json"
              disabled={clientes.length === 0}
            />
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="cadastro" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="cadastro">Clientes Cadastrados</TabsTrigger>
            <TabsTrigger value="ranking">Ranking de Clientes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cadastro" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {searchTerm && (
                <Button variant="outline" size="icon" onClick={() => setSearchTerm("")}>
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {renderClientesList()}
          </TabsContent>
          
          <TabsContent value="ranking" className="space-y-4">
            {/* Filtros do Ranking */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Filtros do Ranking</h3>
                    <Button variant="ghost" size="sm" onClick={clearFiltros}>
                      <FilterX className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Filtrar por:</span>
                      <Select value={filtroTipo} onValueChange={(value: "periodo" | "quantidade") => setFiltroTipo(value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quantidade">Quantidade</SelectItem>
                          <SelectItem value="periodo">Período</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {filtroTipo === "periodo" && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">De:</span>
                          <DatePicker
                            date={dataInicio}
                            onDateChange={setDataInicio}
                            placeholder="Data início"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Até:</span>
                          <DatePicker
                            date={dataFim}
                            onDateChange={setDataFim}
                            placeholder="Data fim"
                          />
                        </div>
                      </>
                    )}
                    
                    {filtroTipo === "quantidade" && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Mín. OS:</span>
                        <Input
                          type="number"
                          min="1"
                          value={quantidadeMinima}
                          onChange={(e) => setQuantidadeMinima(Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {renderRanking()}
          </TabsContent>
        </Tabs>
        
        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedCliente ? "Editar" : "Novo"} Cliente</DialogTitle>
              <DialogDescription>
                Para cadastro completo com motores, use a <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary underline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    selectedCliente ? 
                      navigate(`/clientes/editar/${selectedCliente.id}`) : 
                      navigate("/clientes/cadastro");
                  }}
                >
                  página de cadastro avançado
                </Button>.
              </DialogDescription>
            </DialogHeader>
            
            <ClienteForm
              initialData={selectedCliente}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
        
        {/* View Details Dialog */}
        <ClienteDetalhes 
          cliente={selectedCliente} 
          isOpen={isDetalhesOpen} 
          onClose={() => setIsDetalhesOpen(false)}
          onEdit={(cliente) => {
            setIsDetalhesOpen(false);
            setTimeout(() => handleOpenEditDialog(cliente), 100);
          }}
        />

        {/* Confirm Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
