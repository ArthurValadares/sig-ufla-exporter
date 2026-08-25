/**
 * Dias da semana usados na grade de horários do SIG UFLA.
 */
export type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo";

/** Código de uma disciplina, ex.: "GCC123". */
export type CodigoDisciplina = string;

/** Mapa de código de disciplina para o nome completo extraído da página. */
export type MapaDisciplinas = Readonly<Record<CodigoDisciplina, string>>;

/** Um único slot de horário (uma célula da grade) antes do agrupamento em blocos. */
export interface SlotHorario {
  readonly hora: string;
  readonly codigo: string | null;
  readonly sala: string | null;
}

/** Grade bruta: um array de slots por dia da semana, na ordem de {@link DIAS}. */
export type GradeHorario = readonly SlotHorario[][];

/** Um bloco de aula já agrupado (horários consecutivos da mesma disciplina/sala). */
export interface BlocoAula {
  readonly dia: DiaSemana;
  readonly horaInicio: string;
  readonly duracaoMin: number;
  readonly codigo: CodigoDisciplina;
  readonly sala: string;
}

/** Intervalo de datas do período letivo informado pelo usuário. */
export interface PeriodoLetivo {
  readonly dataInicio: Date;
  readonly dataFim: Date;
}
