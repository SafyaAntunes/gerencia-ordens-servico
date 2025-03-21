
import { Phone, Mail, Wrench } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";
import { Separator } from "@/components/ui/separator";

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onClick?: () => void;
}

const tipoServicoLabel = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando"
};

export default function FuncionarioCard({ funcionario, onClick }: FuncionarioCardProps) {
  // Extrair iniciais do nome para avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
    
  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-medium">
          {iniciais}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{funcionario.nome}</h3>
          <p className="text-sm text-muted-foreground">
            {funcionario.especialidades.length} especialidades
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{funcionario.telefone}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{funcionario.email}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Especialidades</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {funcionario.especialidades.map((especialidade) => (
              <span 
                key={especialidade}
                className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
              >
                {tipoServicoLabel[especialidade]}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 flex justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          funcionario.ativo 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {funcionario.ativo ? "Ativo" : "Inativo"}
        </span>
        
        <Button variant="outline" size="sm" onClick={onClick}>
          Ver detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
