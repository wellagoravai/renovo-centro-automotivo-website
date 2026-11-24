import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

// Rascunho de formulário guardado no aparelho enquanto se digita. Se a sessão cair, o
// navegador recarregar a página ou o celular fechar o app, o que foi digitado volta.
// Fica separado por usuário e some ao salvar, ao sair do sistema ou depois de um dia
// (tem dados de cliente: não deve ficar guardado além do necessário).
const PREFIX = 'renovo:draft:';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface StoredDraft<T> {
  savedAt: number;
  data: T;
}

function readDraft<T>(key: string): T | null {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null') as StoredDraft<T> | null;
    return stored && Date.now() - stored.savedAt < MAX_AGE_MS ? stored.data : null;
  } catch {
    return null;
  }
}

function removeDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Sem armazenamento no navegador: não há rascunho para apagar.
  }
}

function eachDraftKey(action: (key: string) => void) {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith(PREFIX)).forEach(action);
  } catch {
    // Sem armazenamento no navegador: não há rascunhos.
  }
}

export const clearDrafts = () => eachDraftKey(removeDraft);

export const clearExpiredDrafts = () => eachDraftKey((key) => {
  if (readDraft(key) === null) removeDraft(key);
});

// name nulo desliga o rascunho (ex.: registro que já está salvo no servidor).
export function useFormDraft<T>(name: string | null, snapshot: T, apply: (data: T) => void) {
  const { user } = useAuth();
  const key = name && user?.id ? `${PREFIX}${user.id}:${name}` : null;
  const json = JSON.stringify(snapshot);
  const [restored, setRestored] = useState(false);

  const jsonRef = useRef(json);
  jsonRef.current = json;
  const applyRef = useRef(apply);
  applyRef.current = apply;
  // Formulário ainda não preenchido: só vira rascunho o que for diferente disto.
  const baseline = useRef(json);
  const previousKey = useRef<string | null>(null);
  const written = useRef(false);

  useEffect(() => {
    // O registro acabou de ser salvo no servidor: o rascunho não serve mais.
    if (previousKey.current && previousKey.current !== key) removeDraft(previousKey.current);
    previousKey.current = key;
    written.current = false;
    setRestored(false);
    if (!key) return;

    baseline.current = jsonRef.current;
    const draft = readDraft<T>(key);
    if (draft !== null) {
      applyRef.current(draft);
      setRestored(true);
    }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    if (json !== baseline.current) {
      try {
        localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data: JSON.parse(json) }));
        written.current = true;
      } catch {
        // Armazenamento cheio ou bloqueado: segue sem rascunho.
      }
    } else if (written.current) {
      removeDraft(key);
    }
  }, [key, json]);

  // Chamar depois de salvar.
  const clear = () => {
    if (key) removeDraft(key);
    baseline.current = jsonRef.current;
    written.current = false;
    setRestored(false);
  };

  // Volta o formulário ao estado vazio.
  const discard = () => {
    if (key) removeDraft(key);
    written.current = false;
    setRestored(false);
    applyRef.current(JSON.parse(baseline.current) as T);
  };

  return { restored, clear, discard };
}
