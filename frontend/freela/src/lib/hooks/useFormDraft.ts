"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StorageType = "localStorage" | "sessionStorage";

interface UseFormDraftOptions<T> {
  /** Chave unica no storage (ex: "ufreela:job-post-draft"). */
  key: string;
  /** Valor inicial quando nao ha draft salvo. */
  initial: T;
  /** Tempo de vida em ms. Padrao 30 min. */
  ttlMs?: number;
  /** Campos a omitir da serializacao (ex: File, senhas). */
  omit?: (keyof T)[];
  /** Tipo de storage. Padrao localStorage. Use sessionStorage para drafts efemeros. */
  storage?: StorageType;
}

interface PersistedDraft<T> {
  data: Partial<T>;
  ts: number;
}

/**
 * Hook generico para persistir rascunho de formulario em localStorage
 * (ou sessionStorage). Salva automaticamente a cada mudanca de estado e
 * restaura na montagem. O draft expira apos ttlMs e e limpado manualmente
 * apos o submit bem-sucedido.
 *
 * Exemplo:
 *   const { data, setData, clear, restored } = useFormDraft({
 *     key: "ufreela:job-post-draft",
 *     initial: { title: "", description: "", budget_min: 0 },
 *     omit: ["attachment"], // File nao e serializavel
 *   });
 */
export function useFormDraft<T extends Record<string, unknown>>({
  key,
  initial,
  ttlMs = 30 * 60 * 1000,
  omit = [],
  storage = "localStorage",
}: UseFormDraftOptions<T>) {
  const [data, setData] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const omitSet = useRef(new Set(omit as string[]));

  // Restaura o draft na montagem
  useEffect(() => {
    try {
      const store =
        storage === "sessionStorage" ? sessionStorage : localStorage;
      const raw = store.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PersistedDraft<T>;
      if (Date.now() - parsed.ts > ttlMs) {
        store.removeItem(key);
        return;
      }

      setData((prev) => ({ ...prev, ...parsed.data }));
    } catch {
      // JSON invalido ou storage indisponivel -- ignora.
    } finally {
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Salva o draft a cada mudanca de data
  useEffect(() => {
    if (!restored) return;

    const omitFields = omitSet.current;
    const serializable: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (omitFields.has(k)) continue;
      serializable[k] = v;
    }

    try {
      const store =
        storage === "sessionStorage" ? sessionStorage : localStorage;
      store.setItem(
        key,
        JSON.stringify({ data: serializable, ts: Date.now() }),
      );
    } catch {
      // Quota cheia ou modo privado -- ignora.
    }
  }, [data, restored, key, storage]);

  const clear = useCallback(() => {
    try {
      const store =
        storage === "sessionStorage" ? sessionStorage : localStorage;
      store.removeItem(key);
    } catch {
      // ignora
    }
  }, [key, storage]);

  return { data, setData, clear, restored };
}