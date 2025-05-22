import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Motor {
  id?: number;
  marca: string;
  modelo: string;
  descricao: string;
  familia: string;
  potencia: string;
  quantidadeCilindros: string;
  disposicaoCilindros: string;
  quantidadeValvulas: string;
  combustivel: string;
  peso: string;
  cilindradas: string;
  aplicacao: string;
  ativo: boolean;
}

export default function MotorCadastro({ onLogout }: { onLogout: () => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [motor, setMotor] = useState<Motor>({
    marca: "",
    modelo: "",
    descricao: "",
    familia: "",
    potencia: "",
    quantidadeCilindros: "",
    disposicaoCilindros: "",
    quantidadeValvulas: "",
    combustivel: "",
    peso: "",
    cilindradas: "",
    aplicacao: "",
    ativo: true
  });

  useEffect(() => {
    if (id) {
      carregarMotor();
    }
  }, [id]);

  const carregarMotor = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada à API para carregar dados do motor
      // const response = await api.get(`/motores/${id}`);
      // setMotor(response.data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do motor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let motores = JSON.parse(localStorage.getItem('motores') || '[]');
      if (id) {
        // Atualizar motor existente
        motores = motores.map((m: any) => m.id === id ? { ...motor, id } : m);
        toast({
          title: "Sucesso",
          description: "Motor atualizado com sucesso!",
        });
      } else {
        // Criar novo motor
        const novoMotor = { ...motor, id: Date.now().toString() };
        motores.push(novoMotor);
        toast({
          title: "Sucesso",
          description: "Motor cadastrado com sucesso!",
        });
      }
      localStorage.setItem('motores', JSON.stringify(motores));
      navigate("/motores");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o motor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? "Editar Motor" : "Novo Motor"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={motor.marca}
                  onChange={e => setMotor({ ...motor, marca: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={motor.modelo}
                  onChange={e => setMotor({ ...motor, modelo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={motor.descricao}
                  onChange={e => setMotor({ ...motor, descricao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familia">Família</Label>
                <Input
                  id="familia"
                  value={motor.familia}
                  onChange={e => setMotor({ ...motor, familia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="potencia">Potência</Label>
                <Input
                  id="potencia"
                  value={motor.potencia}
                  onChange={e => setMotor({ ...motor, potencia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadeCilindros">Quantidade de Cilindros</Label>
                <Input
                  id="quantidadeCilindros"
                  type="number"
                  value={motor.quantidadeCilindros}
                  onChange={e => setMotor({ ...motor, quantidadeCilindros: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disposicaoCilindros">Disposição dos Cilindros</Label>
                <Input
                  id="disposicaoCilindros"
                  value={motor.disposicaoCilindros}
                  onChange={e => setMotor({ ...motor, disposicaoCilindros: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadeValvulas">Quantidade de Válvulas</Label>
                <Input
                  id="quantidadeValvulas"
                  type="number"
                  value={motor.quantidadeValvulas}
                  onChange={e => setMotor({ ...motor, quantidadeValvulas: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="combustivel">Combustível</Label>
                <Input
                  id="combustivel"
                  value={motor.combustivel}
                  onChange={e => setMotor({ ...motor, combustivel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso">Peso</Label>
                <Input
                  id="peso"
                  value={motor.peso}
                  onChange={e => setMotor({ ...motor, peso: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cilindradas">Cilindradas</Label>
                <Input
                  id="cilindradas"
                  value={motor.cilindradas}
                  onChange={e => setMotor({ ...motor, cilindradas: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="aplicacao">Aplicação</Label>
                <Input
                  id="aplicacao"
                  value={motor.aplicacao}
                  onChange={e => setMotor({ ...motor, aplicacao: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 md:col-span-2">
                <Switch
                  id="ativo"
                  checked={motor.ativo}
                  onCheckedChange={checked => setMotor({ ...motor, ativo: checked })}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/motores")}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {id ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 