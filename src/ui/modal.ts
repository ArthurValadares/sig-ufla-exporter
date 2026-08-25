import { IDS } from "../constants";
import { baixarArquivo } from "../download";
import { gerarICS } from "../ics";
import type { BlocoAula, MapaDisciplinas, PeriodoLetivo } from "../types";
import { pad } from "../utils";
import { criarSelectAno, criarSelectDia, criarSelectMes, lerData } from "./dateSelects";

const NOME_ARQUIVO_ICS = "horario-ufla.ics";
const URL_IMPORTACAO_GOOGLE_CALENDAR = "https://calendar.google.com/calendar/r/settings/export";
const MINUTOS_POR_HORA = 60;

function montarResumo(blocos: readonly BlocoAula[], disciplinas: MapaDisciplinas): string {
  return blocos
    .map((bloco) => {
      const nome = disciplinas[bloco.codigo] ?? bloco.codigo;
      const [horaStr, minutoStr] = bloco.horaInicio.split(":");
      const hora = Number(horaStr);
      const minuto = Number(minutoStr);
      const fimEmMinutos = hora * MINUTOS_POR_HORA + minuto + bloco.duracaoMin;
      const fimHora = pad(Math.floor(fimEmMinutos / MINUTOS_POR_HORA));
      const fimMinuto = pad(fimEmMinutos % MINUTOS_POR_HORA);
      const sala = bloco.sala ? ` @ ${bloco.sala}` : "";
      return `${bloco.dia} ${bloco.horaInicio}–${fimHora}:${fimMinuto} — ${bloco.codigo} (${nome})${sala}`;
    })
    .join("<br>");
}

function montarMarkup(resumo: string): string {
  return `
    <div id="sig-ufla-modal">
      <h2>Exportar horário</h2>
      <p>Informe o período letivo. As aulas serão repetidas semanalmente entre essas datas.</p>
      <label>Início do semestre</label>
      <div class="sig-ufla-data-row">
        ${criarSelectDia("sig-ufla-inicio-dia")}
        ${criarSelectMes("sig-ufla-inicio-mes")}
        ${criarSelectAno("sig-ufla-inicio-ano")}
      </div>
      <label>Término do semestre</label>
      <div class="sig-ufla-data-row">
        ${criarSelectDia("sig-ufla-fim-dia")}
        ${criarSelectMes("sig-ufla-fim-mes")}
        ${criarSelectAno("sig-ufla-fim-ano")}
      </div>
      <div class="sig-ufla-summary" id="sig-ufla-summary-area">${resumo}</div>
      <div id="sig-ufla-error"></div>
      <div class="sig-ufla-actions-vertical">
        <button id="sig-ufla-export-ics" type="button">Exportar para ICS</button>
        <button id="sig-ufla-export-import" class="sig-ufla-destaque" type="button">Exportar &amp; Importar no Google Calendar</button>
      </div>
      <div class="sig-ufla-actions">
        <button id="sig-ufla-cancel" type="button">Cancelar</button>
      </div>
    </div>
  `;
}

function coletarPeriodoOuErro(overlay: HTMLElement): PeriodoLetivo | null {
  const erroDiv = overlay.querySelector<HTMLElement>("#sig-ufla-error");
  const dataInicio = lerData(overlay, "sig-ufla-inicio");
  const dataFim = lerData(overlay, "sig-ufla-fim");

  const mostrarErro = (mensagem: string): null => {
    if (erroDiv) {
      erroDiv.textContent = mensagem;
      erroDiv.style.display = "block";
    }
    return null;
  };

  if (!dataInicio || !dataFim) {
    return mostrarErro("Preencha as duas datas completas.");
  }
  if (dataFim <= dataInicio) {
    return mostrarErro("A data de término deve ser depois da data de início.");
  }

  if (erroDiv) erroDiv.style.display = "none";
  return { dataInicio, dataFim };
}

/**
 * Cria e exibe o modal de exportação, contendo o resumo das aulas
 * detectadas e os seletores de data de início/fim do período letivo.
 */
export function abrirModal(blocos: readonly BlocoAula[], disciplinas: MapaDisciplinas): void {
  const overlay = document.createElement("div");
  overlay.id = IDS.overlay;
  overlay.innerHTML = montarMarkup(montarResumo(blocos, disciplinas));
  document.body.appendChild(overlay);

  overlay.querySelector("#sig-ufla-cancel")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (evento) => {
    if (evento.target === overlay) overlay.remove();
  });

  overlay.querySelector("#sig-ufla-export-ics")?.addEventListener("click", () => {
    const periodo = coletarPeriodoOuErro(overlay);
    if (!periodo) return;
    const ics = gerarICS(blocos, disciplinas, periodo.dataInicio, periodo.dataFim);
    baixarArquivo(ics, NOME_ARQUIVO_ICS);
  });

  overlay.querySelector("#sig-ufla-export-import")?.addEventListener("click", () => {
    const periodo = coletarPeriodoOuErro(overlay);
    if (!periodo) return;
    const ics = gerarICS(blocos, disciplinas, periodo.dataInicio, periodo.dataFim);
    baixarArquivo(ics, NOME_ARQUIVO_ICS);
    window.open(URL_IMPORTACAO_GOOGLE_CALENDAR, "_blank");
  });
}
