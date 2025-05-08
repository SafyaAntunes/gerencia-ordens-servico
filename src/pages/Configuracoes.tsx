
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Clock, ListTodo, Wrench, Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Configuracoes() {
  const { funcionario } = useAuth();
  const isAdmin = funcionario?.nivelPermissao === 'admin';
  const isGerente = funcionario?.nivelPermissao === 'gerente';
  const canAccessConfig = isAdmin || isGerente;
  const [activeTab, setActiveTab] = useState("geral");

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-left">Configurações do Sistema</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="geral">Configurações Gerais</TabsTrigger>
            <TabsTrigger value="servicos">Tipos de Serviço</TabsTrigger>
            <TabsTrigger value="subatividades">Subatividades</TabsTrigger>
            <TabsTrigger value="tempos">Tempos</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Administração</TabsTrigger>}
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Defina as configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-left">
                  Configure aspectos gerais como nome da empresa, logo, cores e preferências.
                </p>
                <div className="mt-4 flex justify-start">
                  <Button disabled>Em desenvolvimento</Button>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Usuários e Permissões
                  </CardTitle>
                  <CardDescription>
                    Gerencie os usuários do sistema e suas permissões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-left">
                    Controle quem pode acessar cada funcionalidade do sistema.
                  </p>
                  <div className="mt-4 flex justify-start">
                    <Button asChild disabled={!isAdmin}>
                      <Link to="/funcionarios">Gerenciar Usuários</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="servicos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Tipos de Serviço
                </CardTitle>
                <CardDescription>
                  Configure os tipos de serviço disponíveis no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-left">
                  Adicione, edite ou desative tipos de serviço que podem ser selecionados nas ordens de serviço.
                </p>
                <div className="mt-4 flex justify-start">
                  <Button asChild disabled={!canAccessConfig}>
                    <Link to="/configuracoes/servicos">Gerenciar Tipos de Serviço</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subatividades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListTodo className="h-5 w-5 mr-2" />
                  Subatividades
                </CardTitle>
                <CardDescription>
                  Configure as subatividades para cada tipo de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-left">
                  Gerencie a lista de subatividades disponíveis para cada tipo de serviço no sistema.
                </p>
                <div className="mt-4 flex justify-start">
                  <Button asChild>
                    <Link to="/configuracoes/subatividades">Gerenciar Subatividades</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tempos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Tempos de Atividades
                </CardTitle>
                <CardDescription>
                  Defina os tempos padrão para cada tipo de atividade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-left">
                  Configure os tempos estimados para cada tipo de serviço e atividade no sistema.
                </p>
                <div className="mt-4 flex justify-start">
                  <Button asChild>
                    <Link to="/configuracoes/atividades">Configurar Tempos</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Backup do Sistema
                  </CardTitle>
                  <CardDescription>
                    Gerencie backups do banco de dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-left">
                    Faça backup e restaure os dados do sistema quando necessário.
                  </p>
                  <div className="mt-4 flex justify-start">
                    <Button disabled>Em desenvolvimento</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Reset de Subatividades
                  </CardTitle>
                  <CardDescription>
                    Ferramenta de administração
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-left">
                    Cuidado! Esta função reinicia todas as subatividades para os valores padrão.
                  </p>
                  <div className="mt-4 flex justify-start">
                    <Button asChild variant="destructive">
                      <Link to="/configuracoes/subatividades/reset">Reset Subatividades</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
