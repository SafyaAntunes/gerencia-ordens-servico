import { useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { OrdemServico, TipoServico } from "@/types/ordens";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const LEFT_KEY = "ordens-presentation-order-left";
const RIGHT_KEY = "ordens-presentation-order-right";

type ColumnKey = "left" | "right";

function classifyOrdem(ordem: OrdemServico): ColumnKey {
  const tipos = new Set((ordem.servicos || []).map((s) => s.tipo));
  
  // Serviços de montagem/teste
  const montagemTesteSet = new Set([TipoServico.MONTAGEM, TipoServico.DINAMOMETRO]);
  const hasMontagemTeste = tipos.has(TipoServico.MONTAGEM) || tipos.has(TipoServico.DINAMOMETRO);
  
  // Serviços de retífica
  const retificaSet = new Set([
    TipoServico.BLOCO,
    TipoServico.BIELA,
    TipoServico.CABECOTE,
    TipoServico.VIRABREQUIM,
    TipoServico.EIXO_COMANDO,
  ]);
  const hasRetifica = Array.from(tipos).some((t) => retificaSet.has(t));
  
  // Nova lógica: Montagem APENAS se tiver SOMENTE serviços de montagem/dinamômetro
  const onlyMontagemTeste = hasMontagemTeste && Array.from(tipos).every((t) => montagemTesteSet.has(t));
  
  // Se tem apenas montagem/teste -> direita
  if (onlyMontagemTeste) return "right";
  
  // Se tem retífica (independente de outros) -> esquerda
  if (hasRetifica) return "left";
  
  // Outros casos -> direita (padrão)
  return "right";
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

  const docRef = useMemo(() => doc(db, "ordens_presentation", "default"), []);
  const writeInProgressRef = useRef(false);

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

  // Sincronização em tempo real com Firestore
  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function ensureAndSubscribe() {
      try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          // Inicializa doc com a ordem atual (reconciliada com localStorage)
          const initialLeft = reconcileOrder(leftOrderIds, leftIds).filter((id) => leftIds.includes(id));
          const initialRight = reconcileOrder(rightOrderIds, rightIds).filter((id) => rightIds.includes(id));
          writeInProgressRef.current = true;
          await setDoc(docRef, {
            left: initialLeft,
            right: initialRight,
            updatedAt: serverTimestamp(),
          });
          writeInProgressRef.current = false;
          setLeftOrderIds(initialLeft);
          setRightOrderIds(initialRight);
          localStorage.setItem(LEFT_KEY, JSON.stringify(initialLeft));
          localStorage.setItem(RIGHT_KEY, JSON.stringify(initialRight));
        }
      } catch (e) {
        // Falha ao inicializar — segue sem travar
      }

      unsub = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Ignora writes locais pendentes para evitar loops
          if (snapshot.metadata.hasPendingWrites) return;
          if (!snapshot.exists()) return;

          const data = snapshot.data() as any;
          const remoteLeft: string[] = Array.isArray(data.left) ? data.left : [];
          const remoteRight: string[] = Array.isArray(data.right) ? data.right : [];

          // Reconciliar com a classificação atual
          const cleanedLeft = reconcileOrder(remoteLeft, leftIds).filter((id) => leftIds.includes(id));
          const cleanedRight = reconcileOrder(remoteRight, rightIds).filter((id) => rightIds.includes(id));

          const leftChanged = JSON.stringify(cleanedLeft) !== JSON.stringify(leftOrderIds);
          const rightChanged = JSON.stringify(cleanedRight) !== JSON.stringify(rightOrderIds);

          if (leftChanged) {
            setLeftOrderIds(cleanedLeft);
            localStorage.setItem(LEFT_KEY, JSON.stringify(cleanedLeft));
          }
          if (rightChanged) {
            setRightOrderIds(cleanedRight);
            localStorage.setItem(RIGHT_KEY, JSON.stringify(cleanedRight));
          }

          // Se houve limpeza (migraram de coluna ou IDs inexistentes), persiste doc limpo
          const needsRemoteCleanup =
            JSON.stringify(cleanedLeft) !== JSON.stringify(remoteLeft) ||
            JSON.stringify(cleanedRight) !== JSON.stringify(remoteRight);

          if (needsRemoteCleanup && !writeInProgressRef.current) {
            writeInProgressRef.current = true;
            updateDoc(docRef, {
              left: cleanedLeft,
              right: cleanedRight,
              updatedAt: serverTimestamp(),
            })
              .catch(() => {})
              .finally(() => {
                writeInProgressRef.current = false;
              });
          }
        }
      );
    }

    ensureAndSubscribe();

    return () => {
      if (unsub) unsub();
    };
    // Reassina quando classificação muda (ex.: OS entrou/saiu/mudou de coluna)
  }, [docRef, leftIds, rightIds]);

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
      writeInProgressRef.current = true;
      updateDoc(docRef, { left: next, right: rightOrderIds, updatedAt: serverTimestamp() })
        .catch(async () => {
          await setDoc(docRef, { left: next, right: rightOrderIds, updatedAt: serverTimestamp() });
        })
        .finally(() => {
          writeInProgressRef.current = false;
        });
    } else {
      const from = rightOrderIds.indexOf(activeId);
      const to = rightOrderIds.indexOf(overId);
      if (from === -1 || to === -1) return;
      const next = arrayMove(rightOrderIds, from, to);
      setRightOrderIds(next);
      localStorage.setItem(RIGHT_KEY, JSON.stringify(next));
      writeInProgressRef.current = true;
      updateDoc(docRef, { left: leftOrderIds, right: next, updatedAt: serverTimestamp() })
        .catch(async () => {
          await setDoc(docRef, { left: leftOrderIds, right: next, updatedAt: serverTimestamp() });
        })
        .finally(() => {
          writeInProgressRef.current = false;
        });
    }
  }

  return { leftOrdens, rightOrdens, handleReorder };
}
