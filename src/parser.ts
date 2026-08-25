import { CODIGO_REGEX, DIAS, DURACAO_AULA_MIN } from "./constants";
import type { BlocoAula, DiaSemana, GradeHorario, MapaDisciplinas, SlotHorario } from "./types";

const HORA_REGEX = /^\d{2}:\d{2}$/;
const DISCIPLINA_REGEX = /([A-Z]{2,5}\d{1,4})\s*-\s*([^:\n]+):/g;
const QUANTIDADE_MINIMA_COLUNAS = 8; // hora + 7 dias

/**
 * Localiza a tabela de horários na página do SIG procurando pelo <thead>
 * que contém todos os nomes dos dias da semana.
 */
export function encontrarTabelaHorario(document: Document): HTMLTableElement | null {
  const theads = Array.from(document.querySelectorAll("thead"));
  const thead = theads.find(
    (t) => t.textContent?.includes("Segunda") && t.textContent?.includes("Domingo"),
  );
  return thead?.closest("table") ?? null;
}

/**
 * Percorre as linhas do <tbody> da tabela de horários e monta a grade bruta,
 * um array de slots por dia da semana.
 */
export function extrairGrade(table: HTMLTableElement): GradeHorario | null {
  const tbody = table.querySelector("tbody");
  if (!tbody) return null;

  const linhas = Array.from(tbody.querySelectorAll("tr"));
  const grade: SlotHorario[][] = DIAS.map(() => []);

  for (const tr of linhas) {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (tds.length < QUANTIDADE_MINIMA_COLUNAS) continue; // linha espaçadora sem conteúdo

    const hora = tds[0]?.textContent?.trim() ?? "";
    if (!HORA_REGEX.test(hora)) continue;

    for (let d = 0; d < DIAS.length; d++) {
      const celula = tds[d + 1];
      const html = celula?.innerHTML ?? "";
      const partes = html
        .split(/<br\s*\/?>/i)
        .map((s) => s.replace(/<[^>]+>/g, "").trim())
        .filter((s) => s.length > 0);

      const slot: SlotHorario = {
        hora,
        codigo: partes[0] ?? null,
        sala: partes[1] ?? null,
      };
      grade[d]?.push(slot);
    }
  }

  return grade;
}

/**
 * Agrupa horários consecutivos com o mesmo código de disciplina e sala em
 * blocos de aula únicos, evitando um evento por hora.
 */
export function extrairBlocos(grade: GradeHorario): BlocoAula[] {
  const blocos: BlocoAula[] = [];

  for (let d = 0; d < DIAS.length; d++) {
    const dia = DIAS[d] as DiaSemana;
    const slots = grade[d] ?? [];
    let i = 0;

    while (i < slots.length) {
      const atual = slots[i];
      if (!atual?.codigo || !CODIGO_REGEX.test(atual.codigo)) {
        i++;
        continue;
      }

      let j = i + 1;
      while (j < slots.length) {
        const proximo = slots[j];
        if (proximo?.codigo === atual.codigo && proximo?.sala === atual.sala) {
          j++;
        } else {
          break;
        }
      }

      const quantidadeAulas = j - i;
      blocos.push({
        dia,
        horaInicio: atual.hora,
        duracaoMin: quantidadeAulas * DURACAO_AULA_MIN,
        codigo: atual.codigo,
        sala: atual.sala ?? "",
      });
      i = j;
    }
  }

  return blocos;
}

/**
 * Varre o texto da página em busca de padrões "CODIGO - Nome da disciplina:"
 * para montar o mapa de código -> nome completo.
 */
export function extrairDisciplinas(document: Document): MapaDisciplinas {
  const texto = document.body.innerText || document.body.textContent || "";
  const mapa: Record<string, string> = {};

  for (const match of texto.matchAll(DISCIPLINA_REGEX)) {
    const codigo = match[1]?.trim();
    const nome = match[2]?.trim();
    if (codigo && nome) {
      mapa[codigo] = nome;
    }
  }

  return mapa;
}
