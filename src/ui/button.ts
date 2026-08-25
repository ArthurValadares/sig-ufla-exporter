import { IDS } from "../constants";
import { extrairBlocos, extrairDisciplinas, extrairGrade, encontrarTabelaHorario } from "../parser";
import { abrirModal } from "./modal";

function tratarClique(): void {
  const table = encontrarTabelaHorario(document);
  if (!table) {
    window.alert("Não encontrei a tabela de horários nesta página.");
    return;
  }

  const grade = extrairGrade(table);
  if (!grade) {
    window.alert("Não encontrei a tabela de horários nesta página.");
    return;
  }

  const blocos = extrairBlocos(grade);
  if (blocos.length === 0) {
    window.alert("Nenhuma aula encontrada na tabela de horários.");
    return;
  }

  const disciplinas = extrairDisciplinas(document);
  abrirModal(blocos, disciplinas);
}

/** Cria o botão flutuante de exportação, caso ainda não exista na página. */
export function criarBotaoExportar(): void {
  if (document.getElementById(IDS.botao)) return;

  const botao = document.createElement("button");
  botao.id = IDS.botao;
  botao.type = "button";
  botao.textContent = "📅 Exportar horário";
  botao.addEventListener("click", tratarClique);
  document.body.appendChild(botao);
}
