import { useEffect } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmLeave = () => {
    if (!isDirty) return true;
    return window.confirm(
      "Você tem alterações não salvas. Deseja sair mesmo assim?"
    );
  };

  return { confirmLeave };
}
