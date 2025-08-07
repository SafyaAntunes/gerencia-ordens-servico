import { useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { OrdemServico, TipoServico } from "@/types/ordens";

const LEFT_KEY = "ordens-presentation-order-left";
const RIGHT_KEY = "ordens-presentation-order-right";

type ColumnKey = "left" | "right";

function classifyOrdem(ordem: OrdemServico): ColumnKey {
  const tipos = new Set((ordem.servicos || []).map((s) => s.tipo));
  const hasMontagemTeste = tipos.has(TipoServico.MONTAGEM) || tipos.has(TipoServico.DINAMOMETRO);
  const retificaSet = new Set([
    TipoServico.BLOCO,
    TipoServico.BIELA,
    TipoServico.CABECOTE,
    TipoServico.VIRABREQUIM,
    TipoServico.EIXO_COMANDO,
  ]);
  const hasAnyTipo = tipos.size > 0;
  const onlyRetifica = hasAnyTipo && Array.from(tipos).every((t) => retificaSet.has(t));
  if (hasMontagemTeste) return "right";
  if (onlyRetifica) return "left";
  return "right"; // padrão: vai para direita se não for apenas retífica
}

function reconcileOrder(stored: string[], current: string[]) {
  const inStored = stored.filter((id) => current.includes(id));
  const notInStored = current.filter((id) => !stored.includes(id));
  return [...inStored, ...notInStored];
}

export function useOrdensPresentacao(ordens: OrdemServico[]) {
  const [leftOrderIds, setLeftOrderIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LEFT_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [rightOrderIds, setRightOrderIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RIGHT_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Classificar ordens por coluna
  const { leftIds, rightIds, byId } = useMemo(() => {
    const byIdMap = new Map<string, OrdemServico>();
    const left: string[] = [];
    const right: string[] = [];
    for (const o of ordens) {
      byIdMap.set(o.id, o);
      const column = classifyOrdem(o);
      (column === "left" ? left : right).push(o.id);
    }
    return { leftIds: left, rightIds: right, byId: byIdMap };
  }, [ordens]);

  // Reconciliar e persistir quando dados mudarem
  useEffect(() => {
    const newLeftOrder = reconcileOrder(leftOrderIds, leftIds);
    const newRightOrder = reconcileOrder(rightOrderIds, rightIds);

    // Remover IDs que migraram de coluna
    const cleanedLeft = newLeftOrder.filter((id) => leftIds.includes(id));
    const cleanedRight = newRightOrder.filter((id) => rightIds.includes(id));

    if (JSON.stringify(cleanedLeft) !== JSON.stringify(leftOrderIds)) {
      setLeftOrderIds(cleanedLeft);
      localStorage.setItem(LEFT_KEY, JSON.stringify(cleanedLeft));
    }
    if (JSON.stringify(cleanedRight) !== JSON.stringify(rightOrderIds)) {
      setRightOrderIds(cleanedRight);
      localStorage.setItem(RIGHT_KEY, JSON.stringify(cleanedRight));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftIds, rightIds]);

  const leftOrdens = useMemo(
    () => leftOrderIds.map((id) => byId.get(id)).filter(Boolean) as OrdemServico[],
    [leftOrderIds, byId]
  );
  const rightOrdens = useMemo(
    () => rightOrderIds.map((id) => byId.get(id)).filter(Boolean) as OrdemServico[],
    [rightOrderIds, byId]
  );

  function handleReorder(column: ColumnKey, activeId: string, overId: string) {
    if (!overId || activeId === overId) return;
    if (column === "left") {
      const from = leftOrderIds.indexOf(activeId);
      const to = leftOrderIds.indexOf(overId);
      if (from === -1 || to === -1) return;
      const next = arrayMove(leftOrderIds, from, to);
      setLeftOrderIds(next);
      localStorage.setItem(LEFT_KEY, JSON.stringify(next));
    } else {
      const from = rightOrderIds.indexOf(activeId);
      const to = rightOrderIds.indexOf(overId);
      if (from === -1 || to === -1) return;
      const next = arrayMove(rightOrderIds, from, to);
      setRightOrderIds(next);
      localStorage.setItem(RIGHT_KEY, JSON.stringify(next));
    }
  }

  return { leftOrdens, rightOrdens, handleReorder };
}
