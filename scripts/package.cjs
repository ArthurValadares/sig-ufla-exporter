#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const archiver = require("archiver");

const ALVOS_VALIDOS = new Set(["chrome", "firefox"]);

/**
 * Compacta o conteúdo de `sourceDir` (arquivos soltos, sem incluir a pasta
 * raiz) em `destinoZip`, formato exigido pelas lojas do Chrome e Firefox.
 */
function compactarPasta(sourceDir, destinoZip) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destinoZip);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("warning", (erro) => {
      console.warn(erro);
    });
    archive.on("error", (erro) => reject(erro));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    void archive.finalize();
  });
}

async function main() {
  const target = process.argv[2];

  if (!target || !ALVOS_VALIDOS.has(target)) {
    console.error("Uso: node scripts/package.cjs <chrome|firefox>");
    process.exit(1);
  }

  const distDir = path.resolve(__dirname, "..", "dist");
  const sourceDir = path.join(distDir, target);

  if (!fs.existsSync(sourceDir)) {
    console.error(
      `A pasta "${sourceDir}" não existe. Rode "pnpm run build:${target}" antes de empacotar.`,
    );
    process.exit(1);
  }

  const nomeZip = `sig-ufla-exporter-${target}.zip`;
  const destinoZip = path.join(distDir, nomeZip);

  if (fs.existsSync(destinoZip)) {
    fs.rmSync(destinoZip);
  }

  await compactarPasta(sourceDir, destinoZip);
  console.log(`✔ Gerado: dist/${nomeZip}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
