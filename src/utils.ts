/** Preenche um número com zero à esquerda até 2 dígitos. Ex.: pad(5) -> "05". */
export function pad(valor: number): string {
  return String(valor).padStart(2, "0");
}
