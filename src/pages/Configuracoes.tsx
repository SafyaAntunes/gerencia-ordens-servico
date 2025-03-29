
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ConfiguracoesProps {
  onLogout?: () => void;
}

const Configuracoes = ({ onLogout }: ConfiguracoesProps) => {
  const [activeTab, setActiveTab] = useState("geral");
  const { funcionario } = useAuth();

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Configure os parâmetros do sistema
          </p>
        </div>

        <Tabs defaultValue="geral" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">
              <Settings className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="seguranca">
              <Lock className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>
                  Configurações gerais e informações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium">Versão do Sistema</h3>
                    <p className="text-sm text-muted-foreground">1.0.0</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Última Atualização</h3>
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="seguranca" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-2 text-amber-500" />
                    Credenciais de Administrador
                  </CardTitle>
                  <CardDescription>
                    Credenciais padrão para acesso administrativo
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md bg-muted">
                      <h3 className="font-medium mb-1">Email</h3>
                      <p className="font-mono text-sm">admin@omerel.com</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted">
                      <h3 className="font-medium mb-1">Senha</h3>
                      <p className="font-mono text-sm">admin123</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Estas são as credenciais padrão do administrador do sistema. 
                    Por segurança, recomenda-se alterar a senha após o primeiro acesso.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usuário Atual</CardTitle>
                <CardDescription>
                  Informações do usuário logado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-md bg-muted">
                      <h3 className="font-medium mb-1">Nome</h3>
                      <p>{funcionario?.nome || "N/A"}</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted">
                      <h3 className="font-medium mb-1">Email</h3>
                      <p>{funcionario?.email || "N/A"}</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted">
                      <h3 className="font-medium mb-1">Nível</h3>
                      <p>{funcionario?.nivelPermissao || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Configuracoes;
