
import { useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import FuncionarioForm from "@/components/funcionarios/FuncionarioForm";
import FuncionarioCard from "@/components/funcionarios/FuncionarioCard";
import FuncionarioDetalhes from "@/components/funcionarios/FuncionarioDetalhes";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Funcionario } from "@/types/funcionarios";
import { Plus, Users, BarChart2 } from "lucide-react";
import FuncionarioStatusTab from "@/components/funcionarios/FuncionarioStatusTab";

interface FuncionariosProps {
  onLogout: () => void;
}

export default function Funcionarios({ onLogout }: FuncionariosProps) {
  const [activeTab, setActiveTab] = useState("funcionarios");
  const [showForm, setShowForm] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  
  const {
    funcionarios,
    isLoading,
    createFuncionario,
    updateFuncionario,
    deleteFuncionario,
    fetchFuncionarios
  } = useFuncionarios();

  const handleSubmit = async (data: any) => {
    try {
      if (editingFuncionario) {
        await updateFuncionario(editingFuncionario.id, data);
        toast.success("Funcionário atualizado com sucesso!");
      } else {
        await createFuncionario(data);
        toast.success("Funcionário criado com sucesso!");
      }
      setShowForm(false);
      setEditingFuncionario(null);
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      toast.error("Erro ao salvar funcionário");
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFuncionario(id);
      toast.success("Funcionário excluído com sucesso!");
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast.error("Erro ao excluir funcionário");
    }
  };

  const handleView = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setShowDetalhes(true);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe e acompanhe o desempenho
            </p>
          </div>
          
          {activeTab === "funcionarios" && (
            <Button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Funcionário
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="funcionarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="disponibilidade" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Disponibilidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="funcionarios" className="space-y-4">
            {showForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}
                  </CardTitle>
                  <CardDescription>
                    {editingFuncionario 
                      ? "Atualize as informações do funcionário" 
                      : "Adicione um novo funcionário à equipe"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FuncionarioForm
                    onSubmit={handleSubmit}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingFuncionario(null);
                    }}
                    initialData={editingFuncionario}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funcionarios.map((funcionario) => (
                  <FuncionarioCard
                    key={funcionario.id}
                    funcionario={funcionario}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
                
                {funcionarios.length === 0 && !isLoading && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="disponibilidade">
            <FuncionarioStatusTab />
          </TabsContent>
        </Tabs>
      </div>

      <FuncionarioDetalhes
        funcionario={selectedFuncionario}
        isOpen={showDetalhes}
        onClose={() => {
          setShowDetalhes(false);
          setSelectedFuncionario(null);
        }}
        onEdit={(funcionario) => {
          setShowDetalhes(false);
          handleEdit(funcionario);
        }}
      />
    </Layout>
  );
}
