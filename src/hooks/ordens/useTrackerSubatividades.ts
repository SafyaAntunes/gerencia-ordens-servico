
import { useSubatividadeOperations } from './tracker-subatividades/operations';
import { UseTrackerSubatividadesProps, UseTrackerSubatividadesResult } from './tracker-subatividades/types';

export const useTrackerSubatividades = ({ ordem, onOrdemUpdate }: UseTrackerSubatividadesProps = {}): UseTrackerSubatividadesResult => {
  const {
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  } = useSubatividadeOperations(ordem, onOrdemUpdate);

  return {
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  };
};
