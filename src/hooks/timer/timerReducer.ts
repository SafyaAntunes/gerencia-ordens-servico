import { TimerState } from "@/types/timer";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { saveTimerData } from "@/utils/timerStorage";

// Action types
export type TimerAction =
  | { type: "START_TIMER"; payload: { now: number } }
  | { type: "PAUSE_TIMER"; payload: { now: number; motivo?: string } }
  | { type: "RESUME_TIMER"; payload: { now: number } }
  | { type: "FINISH_TIMER"; payload: { now: number; totalTime?: number } }
  | { type: "UPDATE_ELAPSED_TIME"; payload: { now: number } }
  | { type: "TOGGLE_CRONOMETRO"; payload: { useCronometro: boolean } }
  | { type: "LOAD_SAVED_DATA"; payload: { savedData: TimerState } }
  | { type: "CLOSE_PAUSA"; payload: { now: number } };

export const createInitialTimerState = (): TimerState => ({
  isRunning: false,
  isPaused: false,
  startTime: null,
  pauseTime: null,
  totalPausedTime: 0,
  elapsedTime: 0,
  totalTime: 0,
  usarCronometro: true,
  pausas: []
});

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "START_TIMER":
      console.log("START_TIMER action:", action.payload);
      return {
        ...state,
        isRunning: true,
        isPaused: false,
        startTime: action.payload.now,
        elapsedTime: 0
      };

    case "PAUSE_TIMER": {
      console.log("PAUSE_TIMER action:", action.payload);
      const { now, motivo } = action.payload;
      const novaPausa = {
        inicio: now,
        motivo
      };
      
      return {
        ...state,
        isPaused: true,
        pauseTime: now,
        pausas: [...state.pausas, novaPausa]
      };
    }

    case "RESUME_TIMER": {
      console.log("RESUME_TIMER action:", action.payload);
      const { now } = action.payload;
      const pauseDuration = state.pauseTime ? now - state.pauseTime : 0;
      
      // Update the last pausa with end time
      const novasPausas = [...state.pausas];
      if (novasPausas.length > 0) {
        const ultimaPausa = novasPausas[novasPausas.length - 1];
        novasPausas[novasPausas.length - 1] = {
          ...ultimaPausa,
          fim: now
        };
      }
      
      return {
        ...state,
        isPaused: false,
        pauseTime: null,
        totalPausedTime: state.totalPausedTime + pauseDuration,
        pausas: novasPausas
      };
    }

    case "FINISH_TIMER": {
      console.log("FINISH_TIMER action:", action.payload);
      let totalTime = state.totalTime;
      
      if (action.payload.totalTime !== undefined) {
        // Use the provided total time if available
        totalTime = action.payload.totalTime;
      } else {
        // Otherwise calculate it from elapsed time
        const finalTime = state.elapsedTime;
        totalTime = state.totalTime + finalTime;
      }
      
      return {
        ...state,
        isRunning: false,
        isPaused: false,
        startTime: null,
        pauseTime: null,
        totalPausedTime: 0,
        elapsedTime: 0,
        totalTime
      };
    }

    case "UPDATE_ELAPSED_TIME": {
      const { now } = action.payload;
      if (!state.startTime) return state;
      
      const timeElapsed = now - state.startTime - state.totalPausedTime;
      
      return {
        ...state,
        elapsedTime: Math.max(0, timeElapsed)
      };
    }

    case "TOGGLE_CRONOMETRO":
      return {
        ...state,
        usarCronometro: action.payload.useCronometro
      };

    case "LOAD_SAVED_DATA":
      console.log("LOAD_SAVED_DATA action:", action.payload);
      return {
        ...state,
        ...action.payload.savedData
      };

    case "CLOSE_PAUSA": {
      const { now } = action.payload;
      const novasPausas = [...state.pausas];
      
      if (novasPausas.length > 0) {
        const ultimaPausa = novasPausas[novasPausas.length - 1];
        if (!ultimaPausa.fim) {
          novasPausas[novasPausas.length - 1] = {
            ...ultimaPausa,
            fim: now
          };
        }
      }
      
      return {
        ...state,
        pausas: novasPausas
      };
    }

    default:
      return state;
  }
}

// Helper function to save timer state to storage
export const persistTimerState = (
  ordemId: string,
  etapa: EtapaOS,
  tipoServico: TipoServico | undefined,
  state: TimerState
) => {
  console.log("Persisting timer state:", {ordemId, etapa, tipoServico, state});
  saveTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico, state);
};
