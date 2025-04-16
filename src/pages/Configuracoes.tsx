
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Building, Mail, Save, User, Key, ClipboardList } from "lucide-react";
import SubatividadesConfig from "./SubatividadesConfig";

interface ConfiguracoesProps {
  onLogout: () => void;
}

const empresaFormSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  endereco: z.string().min(5, "Endereço inválido"),
});

const usuarioFormSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senhaAtual: z.string().min(1, "Digite sua senha atual"),
  novaSenha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional(),
  confirmarSenha: z.string().optional(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
}).refine((data) => {
  if (data.novaSenha) return data.novaSenha !== data.senhaAtual;
  return true;
}, {
  message: "A nova senha deve ser diferente da senha atual",
  path: ["novaSenha"],
});

type EmpresaFormValues = z.infer<typeof empresaFormSchema>;
type UsuarioFormValues = z.infer<typeof usuarioFormSchema>;

export default function Configuracoes({ onLogout }: ConfiguracoesProps) {
  const { toast } = useToast();
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [notificacoesApp, setNotificacoesApp] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);
  
  const empresaForm = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaFormSchema),
    defaultValues: {
      nome: "Retífica Motores Exemplo Ltda",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 98765-4321",
      email: "contato@retificamotores.com.br",
      endereco: "Av. Industrial, 1000 - São Paulo, SP - 01234-567",
    },
  });
  
  const usuarioForm = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      nome: "Administrador",
      email: "admin@retificamotores.com.br",
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });
  
  const handleSalvarEmpresa = (values: EmpresaFormValues) => {
    console.log("Dados da empresa:", values);
    toast({
      title: "Configurações salvas",
      description: "Os dados da empresa foram atualizados com sucesso.",
    });
  };
  
  const handleSalvarUsuario = (values: UsuarioFormValues) => {
    console.log("Dados do usuário:", values);
    toast({
      title: "Dados atualizados",
      description: "Suas informações foram atualizadas com sucesso.",
    });
    usuarioForm.reset({
      ...values,
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    });
  };
  
  const handleSalvarNotificacoes = () => {
    toast({
      title: "Preferências salvas",
      description: "Suas preferências de notificações foram atualizadas.",
    });
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema e da sua conta
          </p>
        </div>
        
        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="usuario" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Minha Conta
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="subatividades" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Subatividades
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...empresaForm}>
                  <form onSubmit={empresaForm.handleSubmit(handleSalvarEmpresa)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={empresaForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Empresa</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={empresaForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={empresaForm.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={empresaForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={empresaForm.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="usuario">
            <Card>
              <CardHeader>
                <CardTitle>Minha Conta</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e senha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...usuarioForm}>
                  <form onSubmit={usuarioForm.handleSubmit(handleSalvarUsuario)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={usuarioForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={usuarioForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <h3 className="text-lg font-semibold">Alterar Senha</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={usuarioForm.control}
                        name="senhaAtual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div /> {/* Espaçador */}
                      
                      <FormField
                        control={usuarioForm.control}
                        name="novaSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormDescription>
                              Mínimo de 6 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={usuarioForm.control}
                        name="confirmarSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Key className="mr-2 h-4 w-4" />
                        Atualizar Dados
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notificacoes">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-email">Notificações por E-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas sobre ordens de serviço por e-mail
                      </p>
                    </div>
                    <Switch
                      id="notifications-email"
                      checked={notificacoesEmail}
                      onCheckedChange={setNotificacoesEmail}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-app">Notificações no Aplicativo</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações internas no sistema
                      </p>
                    </div>
                    <Switch
                      id="notifications-app"
                      checked={notificacoesApp}
                      onCheckedChange={setNotificacoesApp}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-app">Modo Escuro</Label>
                      <p className="text-sm text-muted-foreground">
                        Alternar entre modo claro e escuro
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={modoEscuro}
                      onCheckedChange={setModoEscuro}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <div className="flex justify-end w-full">
                  <Button onClick={handleSalvarNotificacoes}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Preferências
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="subatividades">
            <SubatividadesConfig onLogout={onLogout} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
