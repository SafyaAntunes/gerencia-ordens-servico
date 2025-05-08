
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Users, Clock, ListTodo, Wrench, Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Configuracoes() {
  const { funcionario } = useAuth();
  const isAdmin = funcionario?.nivelPermissao === 'admin';
  const isGerente = funcionario?.nivelPermissao === 'gerente';
  const canAccessConfig = isAdmin || isGerente;

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Configuração de Subatividades */}
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
              <p className="text-sm text-muted-foreground">
                Gerencie a lista de subatividades disponíveis para cada tipo de serviço no sistema.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/configuracoes/subatividades">Gerenciar Subatividades</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Configuração de Tipos de Serviço - NEW */}
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
              <p className="text-sm text-muted-foreground">
                Adicione, edite ou desative tipos de serviço que podem ser selecionados nas ordens de serviço.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild disabled={!canAccessConfig}>
                <Link to="/configuracoes/servicos">Gerenciar Tipos de Serviço</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Configuração de Tempos de Atividades */}
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
              <p className="text-sm text-muted-foreground">
                Configure os tempos estimados para cada tipo de serviço e atividade no sistema.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/configuracoes/atividades">Configurar Tempos</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Usuários e Permissões */}
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
                <p className="text-sm text-muted-foreground">
                  Controle quem pode acessar cada funcionalidade do sistema.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild disabled={!isAdmin}>
                  <Link to="/funcionarios">Gerenciar Usuários</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Configurações Gerais */}
          {isAdmin && (
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
                <p className="text-sm text-muted-foreground">
                  Configure aspectos gerais como nome da empresa, logo, cores e preferências.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled>Em desenvolvimento</Button>
              </CardFooter>
            </Card>
          )}

          {/* Backup do Banco de Dados */}
          {isAdmin && (
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
                <p className="text-sm text-muted-foreground">
                  Faça backup e restaure os dados do sistema quando necessário.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled>Em desenvolvimento</Button>
              </CardFooter>
            </Card>
          )}

          {/* Reset de Subatividades */}
          {isAdmin && (
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
                <p className="text-sm text-muted-foreground">
                  Cuidado! Esta função reinicia todas as subatividades para os valores padrão.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="destructive">
                  <Link to="/configuracoes/subatividades/reset">Reset Subatividades</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
