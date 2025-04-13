
export const formatTime = (milliseconds: number): string => {
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
  if (!endTime) {
    endTime = new Date();
  }

  const startMs = startTime instanceof Date ? startTime.getTime() : startTime;
  const endMs = endTime instanceof Date ? endTime.getTime() : endTime;
  
  // Calculate total time
  let totalMs = endMs - startMs;
  
  // Subtract paused time
  for (const pausa of pausas) {
    const pausaStartMs = pausa.inicio instanceof Date ? pausa.inicio.getTime() : pausa.inicio;
    const pausaEndMs = pausa.fim 
      ? (pausa.fim instanceof Date ? pausa.fim.getTime() : pausa.fim) 
      : endMs;
    
    totalMs -= (pausaEndMs - pausaStartMs);
  }
  
  return Math.max(0, totalMs);
};
