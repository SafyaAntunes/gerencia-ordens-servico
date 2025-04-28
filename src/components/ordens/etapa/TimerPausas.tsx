
interface TimerPausasProps {
  pausas?: { 
    inicio: number; 
    fim?: number; 
    motivo?: string 
  }[];
}

export default function TimerPausas({ pausas }: TimerPausasProps) {
  if (!pausas || pausas.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Pausas registradas:</h4>
      <ul className="text-xs space-y-1">
        {pausas.map((pausa, index) => (
          <li key={index} className="bg-gray-50 p-2 rounded">
            <div className="font-medium">
              {new Date(pausa.inicio).toLocaleTimeString()} {pausa.fim ? `- ${new Date(pausa.fim).toLocaleTimeString()}` : '(em andamento)'}
            </div>
            {pausa.motivo && <div className="text-muted-foreground">Motivo: {pausa.motivo}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
