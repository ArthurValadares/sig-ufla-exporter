const TEMPO_REVOGACAO_URL_MS = 5000;

/** Dispara o download de um arquivo de texto no navegador via Blob + link temporário. */
export function baixarArquivo(
  conteudo: string,
  nomeArquivo: string,
  tipoMime = "text/calendar;charset=utf-8",
): void {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), TEMPO_REVOGACAO_URL_MS);
}
