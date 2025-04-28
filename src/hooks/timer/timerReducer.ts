
import { TimerState } from "@/types/timer";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { saveTimerData } from "@/utils/timerStorage";

// Action types
export type TimerAction =
  | { type: "START_TIMER"; payload: { now: number } }
  | { type: "PAUSE_TIMER"; payload: { now: number; motivo?: string } }
  | { type: "RESUME_TIMER"; payload: { now: number } }
  | { type: "FINISH_TIMER"; payload: { now: number } }
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
      return {
        ...state,
        isRunning: true,
        isPaused: false,
        startTime: action.payload.now
      };

    case "PAUSE_TIMER": {
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
      const finalTime = state.elapsedTime;
      const totalTime = state.totalTime + finalTime;
      
      return {
        ...state,
        isRunning: false,
        isPaused: false,
        startTime: null,
        totalPausedTime: 0,
        elapsedTime: 0,
        totalTime
      };
    }

    case "UPDATE_ELAPSED_TIME": {
      const { now } = action.payload;
      const timeElapsed = now - (state.startTime || 0) - state.totalPausedTime;
      
      return {
        ...state,
        elapsedTime: timeElapsed
      };
    }

    case "TOGGLE_CRONOMETRO":
      return {
        ...state,
        usarCronometro: action.payload.useCronometro
      };

    case "LOAD_SAVED_DATA":
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
  saveTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico, state);
};
