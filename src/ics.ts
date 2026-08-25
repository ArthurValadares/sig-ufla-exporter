import { DIA_PARA_ICS, DIA_PARA_JSWEEKDAY } from "./constants";
import type { BlocoAula, MapaDisciplinas } from "./types";
import { pad } from "./utils";

const QUEBRA_LINHA_ICS = "\r\n";
const TIMEZONE_ID = "America/Sao_Paulo";

/** Escapa caracteres especiais de acordo com a RFC 5545 (iCalendar). */
export function escaparICS(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Retorna a próxima data (a partir de `dataBase`, inclusive) que cai no dia da semana informado. */
export function proximaDataParaDiaSemana(dataBase: Date, jsWeekday: number): Date {
  const data = new Date(dataBase.getTime());
  data.setHours(0, 0, 0, 0);
  while (data.getDay() !== jsWeekday) {
    data.setDate(data.getDate() + 1);
  }
  return data;
}

/** Formata uma data local no formato `YYYYMMDDTHHMMSS`, usado com TZID. */
export function formatarICSDate(data: Date): string {
  return `${data.getFullYear()}${pad(data.getMonth() + 1)}${pad(data.getDate())}T${pad(
    data.getHours(),
  )}${pad(data.getMinutes())}00`;
}

/** Formata uma data em UTC no formato `YYYYMMDDTHHMMSSZ`. */
export function formatarICSDateUTC(data: Date): string {
  return `${data.getUTCFullYear()}${pad(data.getUTCMonth() + 1)}${pad(data.getUTCDate())}T${pad(
    data.getUTCHours(),
  )}${pad(data.getUTCMinutes())}${pad(data.getUTCSeconds())}Z`;
}

/**
 * Converte um horário "de parede" em Brasília (UTC-3, sem horário de verão
 * desde 2019) para o instante UTC correspondente, sem depender do fuso
 * horário configurado no navegador do usuário.
 */
export function instanteUTCBrasilia(
  ano: number,
  mes0: number,
  dia: number,
  hora: number,
  minuto: number,
  segundo = 0,
): Date {
  return new Date(Date.UTC(ano, mes0, dia, hora + 3, minuto, segundo));
}

function gerarBlocoTimezone(): string[] {
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${TIMEZONE_ID}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
}

function calcularUntilUTC(dataFimSemestre: Date): string {
  const fimSemestre23h59 = new Date(dataFimSemestre.getTime());
  fimSemestre23h59.setHours(23, 59, 59, 0);
  const untilUTC = instanteUTCBrasilia(
    fimSemestre23h59.getFullYear(),
    fimSemestre23h59.getMonth(),
    fimSemestre23h59.getDate(),
    23,
    59,
    59,
  );
  return formatarICSDateUTC(untilUTC);
}

function gerarEvento(
  bloco: BlocoAula,
  idx: number,
  disciplinas: MapaDisciplinas,
  dataInicioSemestre: Date,
  untilStr: string,
  agora: Date,
): string[] {
  const jsWeekday = DIA_PARA_JSWEEKDAY[bloco.dia];
  const primeiraData = proximaDataParaDiaSemana(dataInicioSemestre, jsWeekday);

  const [horaStr, minutoStr] = bloco.horaInicio.split(":");
  const hora = Number(horaStr);
  const minuto = Number(minutoStr);
  primeiraData.setHours(hora, minuto, 0, 0);

  const dataFimAula = new Date(primeiraData.getTime() + bloco.duracaoMin * 60_000);

  const nomeDisciplina = disciplinas[bloco.codigo];
  const titulo = nomeDisciplina ? `${bloco.codigo} - ${nomeDisciplina}` : bloco.codigo;

  const linhas = [
    "BEGIN:VEVENT",
    `UID:sig-ufla-${bloco.codigo}-${bloco.dia}-${bloco.horaInicio.replace(":", "")}-${idx}@sig-ufla-exporter`,
    `DTSTAMP:${formatarICSDateUTC(agora)}`,
    `DTSTART;TZID=${TIMEZONE_ID}:${formatarICSDate(primeiraData)}`,
    `DTEND;TZID=${TIMEZONE_ID}:${formatarICSDate(dataFimAula)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${DIA_PARA_ICS[bloco.dia]};UNTIL=${untilStr}`,
    `SUMMARY:${escaparICS(titulo)}`,
  ];

  if (bloco.sala) {
    linhas.push(`LOCATION:${escaparICS(bloco.sala)}`);
  }

  linhas.push("END:VEVENT");
  return linhas;
}

/**
 * Gera o conteúdo completo de um arquivo .ics a partir dos blocos de aula
 * extraídos, repetindo cada aula semanalmente entre as datas do período letivo.
 */
export function gerarICS(
  blocos: readonly BlocoAula[],
  disciplinas: MapaDisciplinas,
  dataInicioSemestre: Date,
  dataFimSemestre: Date,
): string {
  const untilStr = calcularUntilUTC(dataFimSemestre);
  const agora = new Date();

  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SIG UFLA Exporter//PT-BR",
    "CALSCALE:GREGORIAN",
    ...gerarBlocoTimezone(),
  ];

  blocos.forEach((bloco, idx) => {
    linhas.push(...gerarEvento(bloco, idx, disciplinas, dataInicioSemestre, untilStr, agora));
  });

  linhas.push("END:VCALENDAR");
  return linhas.join(QUEBRA_LINHA_ICS);
}
