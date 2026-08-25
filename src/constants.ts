import type { DiaSemana } from "./types";

/** Dias da semana na ordem em que aparecem nas colunas da tabela do SIG. */
export const DIAS: readonly DiaSemana[] = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

/** Date.getDay(): 0=Domingo, 1=Segunda, ..., 6=Sábado. */
export const DIA_PARA_JSWEEKDAY: Readonly<Record<DiaSemana, number>> = {
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6,
  Domingo: 0,
};

/** Sigla de dois caracteres usada pela propriedade RRULE:BYDAY do formato iCalendar. */
export const DIA_PARA_ICS: Readonly<Record<DiaSemana, string>> = {
  Segunda: "MO",
  Terça: "TU",
  Quarta: "WE",
  Quinta: "TH",
  Sexta: "FR",
  Sábado: "SA",
  Domingo: "SU",
};

export const MESES_PT: readonly string[] = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Duração padrão de um horário/aula na grade do SIG, em minutos. */
export const DURACAO_AULA_MIN = 50;

/** Reconhece códigos de disciplina, ex.: "GCC123", "MAT1234". */
export const CODIGO_REGEX = /^[A-Z]{2,5}\d{1,4}$/;

export const IDS = {
  botao: "sig-ufla-export-btn",
  overlay: "sig-ufla-overlay",
} as const;
