import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogoutProps } from "@/types/props";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { saveCliente, getCliente } from "@/services/clienteService";
import { Cliente, Motor } from "@/types/clientes";

const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
  telefone: z.string().min(10, { message: "Telefone inválido" }),
  email: z.string().email({ message: "Email inválido" }),
  endereco: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  observacoes: z.string().optional(),
});

export default function ClienteCadastro({ onLogout }: LogoutProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [motores, setMotores] = useState<Motor[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cnpj_cpf: "",
      observacoes: "",
    },
  });
  
  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const clienteData = await getCliente(id);
        
        if (clienteData) {
          setCliente(clienteData);
          
          // Preencher o formulário com os dados do cliente
          form.reset({
            nome: clienteData.nome || "",
            telefone: clienteData.telefone || "",
            email: clienteData.email || "",
            endereco: clienteData.endereco || "",
            cnpj_cpf: clienteData.cnpj_cpf || "",
            observacoes: clienteData.observacoes || "",
          });
          
          // Carregar os motores do cliente se houver
          if (clienteData.motores) {
            setMotores(clienteData.motores);
          }
        } else {
          toast.error("Cliente não encontrado");
          navigate("/clientes");
        }
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        toast.error("Erro ao carregar dados do cliente");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCliente();
  }, [id, navigate, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Preparar objeto cliente
      const clienteData: Cliente = {
        id: id || "",
        ...values,
        motores: motores,
      };
      
      // Salvar cliente
      await saveCliente(clienteData);
      
      toast.success(id ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
      navigate("/clientes");
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMotorAdd = () => {
    // Adicionar motor (implementação omitida para brevidade)
  };
  
  const handleMotorEdit = (motor: Motor) => {
    // Editar motor (implementação omitida para brevidade)
  };
  
  const handleMotorDelete = (motorId: string) => {
    // Excluir motor (implementação omitida para brevidade)
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">
          {id ? "Editar" : "Cadastrar"} Cliente
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center">
            <p>Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Campos do formulário (implementação omitida para brevidade) */}
                  
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/clientes")}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : id ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Motores</h2>
              {/* Implementação de lista de motores (omitida para brevidade) */}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
