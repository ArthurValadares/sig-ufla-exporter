import { MESES_PT } from "../constants";
import { pad } from "../utils";

const PRIMEIRO_DIA_MES = 1;
const ULTIMO_DIA_MES = 31;
const ANOS_PARA_TRAS = 1;
const ANOS_PARA_FRENTE = 2;

export function criarSelectDia(id: string): string {
  let opcoes = `<option value="">Dia</option>`;
  for (let dia = PRIMEIRO_DIA_MES; dia <= ULTIMO_DIA_MES; dia++) {
    opcoes += `<option value="${dia}">${pad(dia)}</option>`;
  }
  return `<select id="${id}">${opcoes}</select>`;
}

export function criarSelectMes(id: string): string {
  let opcoes = `<option value="">Mês</option>`;
  MESES_PT.forEach((nome, i) => {
    opcoes += `<option value="${i + 1}">${nome}</option>`;
  });
  return `<select id="${id}">${opcoes}</select>`;
}

export function criarSelectAno(id: string): string {
  const anoAtual = new Date().getFullYear();
  let opcoes = `<option value="">Ano</option>`;
  for (let ano = anoAtual - ANOS_PARA_TRAS; ano <= anoAtual + ANOS_PARA_FRENTE; ano++) {
    opcoes += `<option value="${ano}">${ano}</option>`;
  }
  return `<select id="${id}">${opcoes}</select>`;
}

/** Lê os três selects (dia/mês/ano) de um prefixo e monta a Date correspondente, ou `null` se incompleta. */
export function lerData(overlay: ParentNode, prefixo: string): Date | null {
  const dia = overlay.querySelector<HTMLSelectElement>(`#${prefixo}-dia`)?.value;
  const mes = overlay.querySelector<HTMLSelectElement>(`#${prefixo}-mes`)?.value;
  const ano = overlay.querySelector<HTMLSelectElement>(`#${prefixo}-ano`)?.value;

  if (!dia || !mes || !ano) return null;
  return new Date(Number(ano), Number(mes) - 1, Number(dia), 0, 0, 0);
}
