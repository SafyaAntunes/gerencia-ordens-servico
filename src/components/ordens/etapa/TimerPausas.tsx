
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Clock } from "lucide-react";

interface TimerPausasProps {
  pausas?: { 
    inicio: number; 
    fim?: number; 
    motivo?: string 
  }[];
  compact?: boolean;
}

export default function TimerPausas({ pausas, compact = false }: TimerPausasProps) {
  if (!pausas || pausas.length === 0) {
    return null;
  }
  
  const calcularDuracao = (inicio: number, fim?: number) => {
    if (!fim) return "Em andamento";
    
    const duracaoMs = fim - inicio;
    const segundos = Math.floor((duracaoMs / 1000) % 60);
    const minutos = Math.floor((duracaoMs / (1000 * 60)) % 60);
    const horas = Math.floor(duracaoMs / (1000 * 60 * 60));
    
    return `${horas}h ${minutos}m ${segundos}s`;
  };
  
  const formatarHora = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm:ss", { locale: ptBR });
  };
  
  const formatarData = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy", { locale: ptBR });
  };
  
  // Se o modo compacto estiver ativado, mostre apenas o contador de pausas
  if (compact) {
    const pausasEmAndamento = pausas.filter(p => !p.fim).length;
    const totalPausas = pausas.length;
    
    return (
      <div className="mt-3 flex items-center text-xs">
        <Clock className="h-3 w-3 mr-1 text-yellow-500" />
        <span>
          {totalPausas} pausa{totalPausas !== 1 ? 's' : ''}
          {pausasEmAndamento > 0 ? ` (${pausasEmAndamento} em andamento)` : ''}
        </span>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2 flex items-center">
        <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
        Pausas registradas ({pausas.length}):
      </h4>
      <ul className="text-xs space-y-1">
        {pausas.map((pausa, index) => (
          <li key={index} className="bg-yellow-50 p-2 rounded border border-yellow-100">
            <div className="font-medium">
              {formatarData(pausa.inicio)} - {formatarHora(pausa.inicio)} 
              {pausa.fim ? ` até ${formatarHora(pausa.fim)}` : ' (em andamento)'}
            </div>
            <div className="flex justify-between mt-1">
              {pausa.motivo && (
                <span className="text-muted-foreground">
                  Motivo: {pausa.motivo}
                </span>
              )}
              <span className="text-muted-foreground ml-2">
                Duração: {calcularDuracao(pausa.inicio, pausa.fim)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
