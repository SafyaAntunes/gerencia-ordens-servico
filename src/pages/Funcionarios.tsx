import { useState, useEffect } from "react";
import { PlusCircle, Filter, Search, Users, CheckCircle2, FilterX } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Funcionario, tipoServicoLabels } from "@/types/funcionarios";
import { TipoServico } from "@/types/ordens";
import FuncionarioCard from "@/components/funcionarios/FuncionarioCard";
import FuncionarioForm from "@/components/funcionarios/FuncionarioForm";
import FuncionarioDetalhes from "@/components/funcionarios/FuncionarioDetalhes";
import { toast } from "sonner";
import { getFuncionarios, saveFuncionario, deleteFuncionario, getFuncionario } from "@/services/funcionarioService";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import ExportImportButtons from "@/components/common/ExportImportButtons";

interface FuncionariosProps {
  onLogout?: () => void;
  meuPerfil?: boolean;
}

export default function Funcionarios({ onLogout, meuPerfil = false }: FuncionariosProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [especialidadeFilter, setEspecialidadeFilter] = useState<TipoServico | "todas">("todas");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "inativos" | "todos">("todos");
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<string | null>(null);
  
  const { funcionario: currentUser } = useAuth();
  const params = useParams();
  const funcionarioId = params.id;
  const isMeuPerfil = meuPerfil || (funcionarioId && currentUser && funcionarioId === currentUser.id);
  const canManageFuncionarios = !isMeuPerfil && currentUser?.nivelPermissao !== 'tecnico';
  
  useEffect(() => {
    if (isMeuPerfil && currentUser) {
      // Se estiver visualizando o próprio perfil, carrega apenas o funcionário atual
      loadSingleFuncionario(currentUser.id);
    } else {
      // Caso contrário, carrega todos os funcionários (para administradores/gerentes)
      fetchFuncionarios();
    }
  }, [currentUser, isMeuPerfil, funcionarioId]);
  
  const loadSingleFuncionario = async (id: string) => {
    setLoading(true);
    try {
      // Se já temos o funcionário atual no state do useAuth, usamos ele
      if (currentUser && currentUser.id === id) {
        setFuncionarios([currentUser]);
        setLoading(false);
        return;
      }
      
      // Caso contrário, buscamos do serviço
      const funcionario = await getFuncionario(id);
      if (funcionario) {
        setFuncionarios([funcionario]);
        // Abre automaticamente o formulário de edição para o próprio perfil
        if (isMeuPerfil) {
          setSelectedFuncionario(funcionario);
          setIsDialogOpen(true);
        }
      } else {
        toast.error('Funcionário não encontrado');
      }
    } catch (error) {
      console.error('Error fetching funcionario:', error);
      toast.error('Erro ao carregar funcionário');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const data = await getFuncionarios();
      setFuncionarios(data);
    } catch (error) {
      console.error('Error fetching funcionarios:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredFuncionarios = funcionarios.filter((funcionario) => {
    // Se estiver no modo "meu perfil", retorna apenas o funcionário atual
    if (isMeuPerfil && currentUser) {
      return funcionario.id === currentUser.id;
    }
    
    const matchesSearch = searchTerm === "" ||
      funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funcionario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funcionario.nomeUsuario?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEspecialidade = especialidadeFilter === "todas" || 
      funcionario.especialidades.includes(especialidadeFilter as TipoServico);
    
    const matchesStatus = statusFilter === "todos" ||
      (statusFilter === "ativos" && funcionario.ativo) ||
      (statusFilter === "inativos" && !funcionario.ativo);
    
    return matchesSearch && matchesEspecialidade && matchesStatus;
  });
  
  const funcionariosAtivos = filteredFuncionarios.filter(f => f.ativo);
  const funcionariosInativos = filteredFuncionarios.filter(f => !f.ativo);
  
  const handleOpenAddDialog = () => {
    setSelectedFuncionario(null);
    setIsDialogOpen(true);
  };
  
  const handleOpenEditDialog = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsDialogOpen(true);
  };
  
  const handleOpenDetailsDialog = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsDetalhesOpen(true);
  };
  
  const handleOpenDeleteDialog = (id: string) => {
    setFuncionarioToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      const funcionarioData: Funcionario = selectedFuncionario
        ? { ...selectedFuncionario, ...values }
        : {
            id: "",
            ...values,
          };
      
      const success = await saveFuncionario(funcionarioData);
      
      if (success) {
        toast.success(
          selectedFuncionario
            ? "Funcionário atualizado com sucesso!"
            : "Funcionário cadastrado com sucesso!"
        );
        setIsDialogOpen(false);
        if (isMeuPerfil && currentUser) {
          loadSingleFuncionario(currentUser.id);
        } else {
          fetchFuncionarios();
        }
      }
    } catch (error) {
      console.error('Error saving funcionario:', error);
      toast.error('Erro ao salvar funcionário');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!funcionarioToDelete) return;
    
    try {
      const success = await deleteFuncionario(funcionarioToDelete);
      
      if (success) {
        toast.success("Funcionário excluído com sucesso!");
        fetchFuncionarios();
        setDeleteDialogOpen(false);
        setFuncionarioToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting funcionario:', error);
      toast.error('Erro ao excluir funcionário');
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setEspecialidadeFilter("todas");
    setStatusFilter("todos");
  };

  // Determina o título da página com base no modo
  const pageTitle = isMeuPerfil ? "Meu Perfil" : "Funcionários";
  const pageDescription = isMeuPerfil 
    ? "Visualize e edite suas informações" 
    : "Gerencie os funcionários da sua retífica";
  
  const handleImportFuncionarios = async (data: any) => {
    if (!Array.isArray(data)) {
      toast.error('Formato inválido. Esperado uma lista de funcionários.');
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    
    try {
      for (const funcionarioData of data) {
        // Verificar se o funcionário tem dados mínimos necessários
        if (!funcionarioData.nome) {
          continue;
        }
        
        const funcionario: Funcionario = {
          id: '',  // ID será gerado no servidor
          ...funcionarioData,
          especialidades: funcionarioData.especialidades || [],
          ativo: funcionarioData.ativo !== undefined ? funcionarioData.ativo : true,
        };
        
        const success = await saveFuncionario(funcionario);
        if (success) successCount++;
      }
      
      toast.success(`${successCount} funcionário(s) importado(s) com sucesso!`);
      fetchFuncionarios();
    } catch (error) {
      console.error('Erro ao importar funcionários:', error);
      toast.error('Erro ao importar funcionários.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const validateFuncionarioData = (data: any): boolean => {
    return Array.isArray(data) && data.some(item => !!item.nome);
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {pageDescription}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {canManageFuncionarios && (
              <>
                <ExportImportButtons
                  data={funcionarios}
                  onImport={handleImportFuncionarios}
                  fileName="funcionarios.json"
                  validateData={validateFuncionarioData}
                  disabled={isSubmitting}
                />
                <Button onClick={handleOpenAddDialog} className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Funcionário
                </Button>
              </>
            )}
          </div>
        </div>
        
        {!isMeuPerfil && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Select
                value={especialidadeFilter}
                onValueChange={(value) => setEspecialidadeFilter(value as TipoServico | "todas")}
              >
                <SelectTrigger className="w-[160px] truncate">
                  <Filter className="h-4 w-4 mr-2" />
                  {especialidadeFilter === "todas" 
                    ? "Especialidade" 
                    : tipoServicoLabels[especialidadeFilter as TipoServico]}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Especialidades</SelectItem>
                  {Object.entries(tipoServicoLabels).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "ativos" | "inativos" | "todos")}
              >
                <SelectTrigger className="w-[120px]">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Status
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchTerm || especialidadeFilter !== "todas" || statusFilter !== "todos") && (
                <Button variant="outline" size="icon" onClick={resetFilters}>
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isMeuPerfil ? (
          // Modo "Meu Perfil" - exibe apenas o card do funcionário atual
          <div className="mt-6">
            {filteredFuncionarios.length > 0 ? (
              <div className="max-w-md mx-auto">
                <FuncionarioCard
                  key={filteredFuncionarios[0].id}
                  funcionario={filteredFuncionarios[0]}
                  onView={handleOpenDetailsDialog}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                  hideDeleteButton={true}
                />
                
                <div className="mt-4 flex justify-center">
                  <Button 
                    className="w-full max-w-xs"
                    onClick={() => handleOpenEditDialog(filteredFuncionarios[0])}
                  >
                    Editar Meu Perfil
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground mt-1">
                  Perfil não encontrado.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Modo "Funcionários" - exibe a lista de todos os funcionários
          <Tabs defaultValue="todos" className="mt-4">
            <TabsList className="mb-6">
              <TabsTrigger value="todos" className="relative">
                Todos
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {filteredFuncionarios.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="ativos" className="relative">
                Ativos
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {funcionariosAtivos.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="inativos" className="relative">
                Inativos
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {funcionariosInativos.length}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="todos">
              {renderFuncionariosList(filteredFuncionarios)}
            </TabsContent>
            
            <TabsContent value="ativos">
              {renderFuncionariosList(funcionariosAtivos)}
            </TabsContent>
            
            <TabsContent value="inativos">
              {renderFuncionariosList(funcionariosInativos)}
            </TabsContent>
          </Tabs>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isMeuPerfil 
                  ? "Editar Meu Perfil" 
                  : selectedFuncionario 
                    ? "Editar Funcionário" 
                    : "Novo Funcionário"}
              </DialogTitle>
              <DialogDescription>
                {isMeuPerfil 
                  ? "Atualize suas informações de perfil." 
                  : `Preencha todos os campos para ${selectedFuncionario ? "atualizar" : "cadastrar"} um funcionário.`}
              </DialogDescription>
            </DialogHeader>
            
            <FuncionarioForm
              initialData={selectedFuncionario}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={isSubmitting}
              isMeuPerfil={isMeuPerfil}
            />
          </DialogContent>
        </Dialog>
        
        <FuncionarioDetalhes 
          funcionario={selectedFuncionario} 
          isOpen={isDetalhesOpen} 
          onClose={() => setIsDetalhesOpen(false)}
          onEdit={(funcionario) => {
            setIsDetalhesOpen(false);
            setTimeout(() => handleOpenEditDialog(funcionario), 100);
          }}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
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
  
  function renderFuncionariosList(list: Funcionario[]) {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum funcionário encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {searchTerm || especialidadeFilter !== "todas" || statusFilter !== "todos" ? (
              <>
                Não encontramos nenhum funcionário com os filtros selecionados. Tente ajustar os filtros.
              </>
            ) : (
              "Comece adicionando seu primeiro funcionário para gerenciar sua equipe."
            )}
          </p>
          {canManageFuncionarios && (
            <Button className="mt-4" onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((funcionario) => (
          <FuncionarioCard
            key={funcionario.id}
            funcionario={funcionario}
            onView={handleOpenDetailsDialog}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
          />
        ))}
      </div>
    );
  }
}
