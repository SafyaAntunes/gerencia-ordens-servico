
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Funcionario, NivelPermissao, permissoesLabels, tipoServicoLabels } from "@/types/funcionarios";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield, Wrench, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Create schemas based on whether we're creating or editing a user
const createFormSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  telefone: z.string().min(8, { message: "Telefone inválido" }),
  especialidades: z.array(z.string()).min(1, { message: "Selecione pelo menos uma especialidade" }),
  ativo: z.boolean().default(true),
  nivelPermissao: z.enum(["admin", "gerente", "tecnico", "visualizacao"] as const).default("visualizacao"),
  senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmarSenha: z.string(),
  nomeUsuario: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

// Edit form schema doesn't require senha and confirmarSenha
const editFormSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  telefone: z.string().min(8, { message: "Telefone inválido" }),
  especialidades: z.array(z.string()).min(1, { message: "Selecione pelo menos uma especialidade" }),
  ativo: z.boolean().default(true),
  nivelPermissao: z.enum(["admin", "gerente", "tecnico", "visualizacao"] as const).default("visualizacao"),
  senha: z.string().optional(),
  confirmarSenha: z.string().optional(),
  nomeUsuario: z.string().optional(),
}).refine((data) => {
  if (data.senha) {
    return data.senha === data.confirmarSenha;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type FormValues = z.infer<typeof createFormSchema> | z.infer<typeof editFormSchema>;

interface FuncionarioFormProps {
  initialData?: Funcionario | null;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isMeuPerfil?: boolean;
}

export default function FuncionarioForm({ initialData, onSubmit, onCancel, isSubmitting, isMeuPerfil }: FuncionarioFormProps) {
  const isEditing = !!initialData?.id;
  // Apenas mostrar credenciais quando for criação de novo funcionário ou edição do próprio perfil
  const [showCredentials, setShowCredentials] = useState(!isEditing || isMeuPerfil || false);
  
  // Use the appropriate schema based on whether we're creating or editing
  const schema = isEditing ? editFormSchema : createFormSchema;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initialData?.nome || "",
      email: initialData?.email || "",
      telefone: initialData?.telefone || "",
      especialidades: initialData?.especialidades || [],
      ativo: initialData?.ativo !== undefined ? initialData.ativo : true,
      nivelPermissao: (initialData?.nivelPermissao as NivelPermissao) || "visualizacao",
      senha: "",
      confirmarSenha: "",
      nomeUsuario: initialData?.nomeUsuario || "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nivelPermissao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Nível de Permissão
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(permissoesLabels).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4" />
            <FormLabel className="text-base m-0">Especialidades</FormLabel>
          </div>
          
          <div className="rounded-md border border-border p-4">
            <FormField
              control={form.control}
              name="especialidades"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(tipoServicoLabels).map(([id, label]) => (
                      <FormField
                        key={id}
                        control={form.control}
                        name="especialidades"
                        render={({ field }) => (
                          <FormItem
                            key={id}
                            className="flex items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(id)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, id]
                                    : field.value?.filter(
                                        (value) => value !== id
                                      );
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {(!isEditing || showCredentials) && (
          <div className="space-y-4 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <FormLabel className="text-base m-0">Credenciais de Acesso</FormLabel>
              </div>
              
              {isEditing && !isMeuPerfil && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCredentials(false)}
                >
                  Ocultar credenciais
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-0">
              {isEditing 
                ? "Defina um nome de usuário e uma nova senha para este funcionário." 
                : "Defina uma senha e um nome de usuário para que o funcionário possa acessar o sistema."}
            </p>
            
            <FormField
              control={form.control}
              name="nomeUsuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="nome.sobrenome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        {isEditing && !showCredentials && !isMeuPerfil && (
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setShowCredentials(true)}
          >
            <Lock className="mr-2 h-4 w-4" />
            Alterar credenciais
          </Button>
        )}
        
        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div>
                <FormLabel>Ativo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Funcionários inativos não aparecerão nas listas de atribuição de tarefas.
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
