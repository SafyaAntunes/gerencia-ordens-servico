import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";
import { Servico, SubAtividade } from "@/types/ordens";

export type ServicoStatus = "pendente" | "em_andamento" | "pausado" | "concluido" | "desabilitado";

interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}

export function useServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onServicoStatusChange,
  onSubatividadeToggle,
}: UseServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [pausas, setPausas] = useState<{ inicio: number; fim?: number }[]>([]);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const { toast } = useToast();

  // Compute derived state
  const subatividadesFiltradas = useMemo(() => servico.subatividades?.filter(s => s.selecionada) || [], [servico.subatividades]);
  
  const completedSubatividades = useMemo(() => {
    return subatividadesFiltradas.filter(s => s.concluida).length;
  }, [subatividadesFiltradas]);
  
  const totalSubatividades = useMemo(() => {
    return subatividadesFiltradas.length;
  }, [subatividadesFiltradas]);
  
  const tempoTotalEstimado = useMemo(() => {
    return subatividadesFiltradas.reduce((acc, curr) => acc + (curr.tempoEstimado || 0), 0);
  }, [subatividadesFiltradas]);
  
  const progressPercentage = useMemo(() => {
    if (totalSubatividades === 0) return 0;
    return Math.round((completedSubatividades / totalSubatividades) * 100);
  }, [completedSubatividades, totalSubatividades]);

  const servicoStatus = useMemo((): ServicoStatus => {
    if (servico.concluido) return "concluido";
    if (isPaused) return "pausado";
    if (isRunning) return "em_andamento";
    if (servico.subatividades?.some(s => s.concluida)) return "em_andamento";
    return "pendente";
  }, [servico.concluido, isPaused, isRunning, servico.subatividades]);

  const temPermissao = true; // Simplified for this example, actual logic would be based on user permissions

  const handleSubatividadeToggle = useCallback((subatividade: SubAtividade) => {
    if (!ordemId || !servico || !subatividade || !subatividade.id) return;
    
    try {
      console.log("Toggling subatividade:", subatividade.id, "to", !subatividade.concluida);
      
      // Call the parent component's toggle handler with the new state
      onSubatividadeToggle(subatividade.id, !subatividade.concluida);
    } catch (error) {
      console.error("Error toggling subatividade:", error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível atualizar a subatividade.",
        variant: "destructive" 
      });
    }
  }, [ordemId, servico, onSubatividadeToggle, toast]);
  
  const handleLoadFuncionarios = useCallback(async () => {
    try {
      const docRef = doc(db, "funcionarios", funcionarioId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const funcionarioData = docSnap.data() as Funcionario;
        setFuncionariosOptions([funcionarioData]);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Failed to load funcionario:", error);
    }
  }, [funcionarioId]);

  const handleStartClick = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now() - (pauseTime ? pauseTime - (startTime || Date.now()) : 0));
    setPauseTime(null);
  }, [startTime, pauseTime]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    setPauseTime(Date.now());
    setPausas(prevPausas => [...prevPausas, { inicio: Date.now() }]);
  }, []);

  const handleResume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now() - (pauseTime ? pauseTime - (startTime || Date.now()) : 0));
    setPauseTime(null);
    setPausas(prevPausas => {
      const lastPause = prevPausas[prevPausas.length - 1];
      if (lastPause && !lastPause.fim) {
        return prevPausas.map((p, i) => i === prevPausas.length - 1 ? { ...p, fim: Date.now() } : p);
      }
      return prevPausas;
    });
  }, [startTime, pauseTime]);

  const handleFinish = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setPauseTime(null);
    setDisplayTime("00:00:00");
    setElapsedSeconds(0);
  }, []);

  const handleMarcarConcluido = useCallback(() => {
    onServicoStatusChange(true, funcionarioId, funcionarioNome);
    handleFinish();
    toast({
      title: "Serviço Concluído",
      description: "Este serviço foi marcado como concluído.",
    });
  }, [funcionarioId, funcionarioNome, onServicoStatusChange, handleFinish, toast]);

  const handleReiniciarServico = useCallback(() => {
    onServicoStatusChange(false, null, null);
    handleFinish();
    toast({
      title: "Serviço Reiniciado",
      description: "Este serviço foi reiniciado e está pronto para ser trabalhado novamente.",
    });
  }, [onServicoStatusChange, handleFinish, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && startTime !== null) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        const seconds = Math.floor(diff / 1000);
        setElapsedSeconds(seconds);

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        setDisplayTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, startTime]);

  useEffect(() => {
    if (servico.concluido) {
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [servico.concluido]);

  return {
    isOpen,
    setIsOpen,
    funcionariosOptions,
    temPermissao,
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido,
    handleReiniciarServico
  };
}
