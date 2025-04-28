
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrdemServico, Motor } from "@/types/ordens";

interface ClienteMotorInfoProps {
  ordem: OrdemServico;
}

export function ClienteMotorInfo({ ordem }: ClienteMotorInfoProps) {
  const motor = ordem.motor as Motor | undefined;

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Dados do Cliente</h3>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium">{ordem.cliente?.nome}</p>
          </div>
          {ordem.cliente?.telefone && (
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{ordem.cliente?.telefone}</p>
            </div>
          )}
          {ordem.cliente?.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{ordem.cliente?.email}</p>
            </div>
          )}
          {ordem.cliente?.cnpj_cpf && (
            <div>
              <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
              <p className="font-medium">{ordem.cliente?.cnpj_cpf}</p>
            </div>
          )}
          {ordem.cliente?.endereco && (
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">{ordem.cliente?.endereco}</p>
            </div>
          )}
        </div>
      </div>
      
      {motor && (
        <div>
          <h3 className="text-lg font-medium mb-2">Dados do Motor</h3>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Marca</p>
              <p className="font-medium">{motor.marca}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-medium">{motor.modelo}</p>
            </div>
            {motor.ano && (
              <div>
                <p className="text-sm text-muted-foreground">Ano</p>
                <p className="font-medium">{motor.ano}</p>
              </div>
            )}
            {motor.cilindrada && (
              <div>
                <p className="text-sm text-muted-foreground">Cilindrada</p>
                <p className="font-medium">{motor.cilindrada}</p>
              </div>
            )}
            {motor.numeroSerie && (
              <div>
                <p className="text-sm text-muted-foreground">Número de Série</p>
                <p className="font-medium">{motor.numeroSerie}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

