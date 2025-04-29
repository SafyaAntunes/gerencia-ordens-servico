
import { useReducer, useEffect } from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { loadTimerData } from "@/utils/timerStorage";
import { timerReducer, createInitialTimerState, persistTimerState } from "./timerReducer";

interface UseTimerStateProps {
  ordemId: string;
  etapa: string;
  tipoServico?: string;
  isEtapaConcluida?: boolean;
}

export function useTimerState({
  ordemId,
  etapa,
  tipoServico,
  isEtapaConcluida = false
}: UseTimerStateProps) {
  const [state, dispatch] = useReducer(timerReducer, createInitialTimerState());
  
  // Load saved time from localStorage
  useEffect(() => {
    console.log("Loading timer data for:", {ordemId, etapa, tipoServico});
    const savedData = loadTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico);
    
    if (savedData) {
      console.log("Found saved timer data:", savedData);
      // If the etapa is completed, just show the total saved time
      if (isEtapaConcluida) {
        dispatch({
          type: "LOAD_SAVED_DATA",
          payload: {
            savedData: {
              ...createInitialTimerState(),
              totalTime: savedData.totalTime || 0,
              pausas: savedData.pausas || []
            }
          }
        });
        return;
      }
      
      dispatch({
        type: "LOAD_SAVED_DATA",
        payload: { savedData }
      });
    } else {
      console.log("No saved timer data found");
    }
  }, [ordemId, etapa, tipoServico, isEtapaConcluida]);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (ordemId && etapa && (state.isRunning || state.totalTime > 0 || state.pausas.length > 0)) {
      console.log("Persisting timer state:", {state, ordemId, etapa, tipoServico});
      persistTimerState(ordemId, etapa as EtapaOS, tipoServico as TipoServico, state);
    }
  }, [
    ordemId, 
    etapa, 
    tipoServico, 
    state.isRunning, 
    state.isPaused, 
    state.startTime, 
    state.pauseTime, 
    state.totalPausedTime, 
    state.elapsedTime, 
    state.totalTime, 
    state.usarCronometro,
    state.pausas
  ]);
  
  // Update timer at regular intervals
  useEffect(() => {
    let interval: number | null = null;
    
    if (state.isRunning && !state.isPaused && state.usarCronometro) {
      interval = window.setInterval(() => {
        dispatch({
          type: "UPDATE_ELAPSED_TIME",
          payload: { now: Date.now() }
        });
      }, 100); // Update 10 times per second for smoother display
      
      console.log("Timer interval created");
    }
    
    return () => {
      if (interval) {
        console.log("Clearing timer interval");
        clearInterval(interval);
      }
    };
  }, [state.isRunning, state.isPaused, state.startTime, state.totalPausedTime, state.usarCronometro]);
  
  return { state, dispatch };
}
