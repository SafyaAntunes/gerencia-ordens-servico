
export const formatTime = (milliseconds: number): string => {
  // Proteger contra valores inválidos
  if (!milliseconds || isNaN(milliseconds) || milliseconds < 0) {
    return '00:00:00';
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(unit => String(unit).padStart(2, '0'))
    .join(':');
};

export const calculateElapsedTime = (
  startTime: Date | number, 
  endTime: Date | number | undefined, 
  pausas: { inicio: Date | number; fim?: Date | number }[] = []
): number => {
  if (!startTime) return 0;
  
  if (!endTime) {
    endTime = Date.now();
  }

  const startMs = startTime instanceof Date ? startTime.getTime() : startTime;
  const endMs = endTime instanceof Date ? endTime.getTime() : endTime;
  
  // Calculate total time
  let totalMs = endMs - startMs;
  
  // Subtract paused time
  for (const pausa of pausas) {
    if (!pausa.inicio) continue;
    
    const pausaStartMs = pausa.inicio instanceof Date ? pausa.inicio.getTime() : pausa.inicio;
    const pausaEndMs = pausa.fim 
      ? (pausa.fim instanceof Date ? pausa.fim.getTime() : pausa.fim) 
      : endMs;
    
    totalMs -= (pausaEndMs - pausaStartMs);
  }
  
  return Math.max(0, totalMs);
};

// Add the missing generateTimerStorageKey function
export const generateTimerStorageKey = (
  ordemId: string, 
  etapa: string, 
  tipoServico?: string
): string => {
  if (!ordemId || !etapa) {
    console.warn("Missing required parameters for timer storage key", {ordemId, etapa, tipoServico});
    return `timer_invalid_${Date.now()}`;
  }
  
  return `timer_${ordemId}_${etapa}${tipoServico ? `_${tipoServico}` : ''}`;
};
