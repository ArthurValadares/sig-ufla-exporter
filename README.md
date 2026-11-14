# SIG UFLA - Exportador de Horário

Extensão de navegador (Chrome e Firefox) que extrai o horário de aulas exibido
no SIG UFLA e gera um arquivo `.ics`, repetindo cada aula semanalmente durante
o período letivo informado, pronto para importar no Google Calendar (ou
qualquer outro app de calendário compatível com iCalendar).

## Sumário

- [Arquitetura](#arquitetura)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Scripts disponíveis](#scripts-disponíveis)
- [Gerando os pacotes (.zip)](#gerando-os-pacotes-zip)
- [Carregando a extensão no navegador](#carregando-a-extensão-no-navegador)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como funciona a extração](#como-funciona-a-extração)
- [Qualidade de código](#qualidade-de-código)
- [Fluxo de branches](#fluxo-de-branches)
- [Releases](#releases)
- [Decisões de design](#decisões-de-design)

## Arquitetura

Todo o código de domínio (parsing da tabela do SIG, geração do `.ics`,
interface do botão/modal) vive em `src/` e é **100% compartilhado** entre
Chrome e Firefox — não há branches de código por navegador. A única diferença
real entre as duas extensões é o `manifest.json`, então o projeto usa três
arquivos de manifest que são mesclados em tempo de build:

| Arquivo                              | Papel                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| `manifests/manifest.base.json`        | Chaves comuns (nome, versão, permissões, content script)   |
| `manifests/manifest.chrome.json`      | Overrides específicos do Chrome (hoje, nenhum)              |
| `manifests/manifest.firefox.json`     | Overrides do Firefox (`browser_specific_settings.gecko`)    |

O Webpack lê o `manifest.base.json`, aplica o override do alvo (`chrome` ou
`firefox`) via *shallow merge* e grava o `manifest.json` final dentro de
`dist/<target>/`.

## Requisitos

- Node.js >= 18
- [pnpm](https://pnpm.io/) >= 9 (`npm i -g pnpm` caso não tenha)

## Instalação

```bash
pnpm install
```

## Scripts disponíveis

| Comando                  | O que faz                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| `pnpm run typecheck`      | Roda o `tsc --noEmit` para checar tipos sem gerar arquivos                 |
| `pnpm run lint`           | Roda o ESLint sobre `src/**/*.ts`                                          |
| `pnpm run lint:fix`       | Roda o ESLint com `--fix`                                                  |
| `pnpm run format`         | Formata `src/` com Prettier                                                |
| `pnpm run build:chrome`   | Compila o content script + CSS + manifest do Chrome em `dist/chrome/`     |
| `pnpm run build:firefox`  | Compila o content script + CSS + manifest do Firefox em `dist/firefox/`   |
| `pnpm run build`          | Roda os dois builds acima                                                  |
| `pnpm run package:chrome` | Builda e gera `dist/sig-ufla-exporter-chrome.zip`                          |
| `pnpm run package:firefox`| Builda e gera `dist/sig-ufla-exporter-firefox.zip`                         |
| `pnpm run package`        | Gera os dois `.zip` de uma vez (comando principal de release)             |
| `pnpm run clean`          | Remove `dist/` e `build/`                                                  |

## Gerando os pacotes (.zip)

```bash
# Gera os dois de uma vez
pnpm run package

# Ou individualmente
pnpm run package:chrome
pnpm run package:firefox
```

Ao final, os artefatos ficam em:

```
dist/
├── chrome/                          # pasta "descompactada" (útil para "Carregar sem compactação")
│   ├── content.js
│   ├── content.css
│   └── manifest.json
├── firefox/
│   ├── content.js
│   ├── content.css
│   └── manifest.json
├── sig-ufla-exporter-chrome.zip      # pronto para upload na Chrome Web Store / instalação manual
└── sig-ufla-exporter-firefox.zip     # pronto para upload na AMO (addons.mozilla.org)
```

Cada `.zip` contém os arquivos **soltos na raiz** (sem uma pasta-mãe dentro),
que é o formato exigido pelas duas lojas.

## Carregando a extensão no navegador

**Chrome / navegadores baseados em Chromium (Edge, Brave, etc.):**

1. Rode `pnpm run build:chrome` (ou descompacte o `.zip`).
2. Acesse `chrome://extensions`.
3. Ative o "Modo do desenvolvedor".
4. Clique em "Carregar sem compactação" e selecione a pasta `dist/chrome`.

**Firefox:**

1. Rode `pnpm run build:firefox` (ou descompacte o `.zip`).
2. Acesse `about:debugging#/runtime/this-firefox`.
3. Clique em "Carregar extensão temporária" e selecione o arquivo
   `dist/firefox/manifest.json`.

## Estrutura de pastas

```
src/
├── constants.ts       # Constantes de domínio (dias, mapas de conversão, regex)
├── types.ts            # Tipos e interfaces compartilhados
├── utils.ts            # Utilitários genéricos (pad)
├── parser.ts            # Extração da tabela de horários e disciplinas do DOM
├── ics.ts               # Geração do arquivo .ics (RFC 5545)
├── download.ts           # Disparo de download de arquivo via Blob
├── content.ts             # Entry point do content script
├── styles/
│   └── content.css        # Estilos do botão flutuante e do modal
└── ui/
    ├── button.ts           # Botão flutuante "Exportar horário"
    ├── modal.ts            # Modal com resumo das aulas e seleção de período
    └── dateSelects.ts       # Helpers para os <select> de dia/mês/ano

manifests/
├── manifest.base.json    # Chaves comuns
├── manifest.chrome.json  # Overrides do Chrome
└── manifest.firefox.json # Overrides do Firefox

scripts/
└── package.cjs            # Compacta dist/<target> em um .zip

webpack.config.cjs          # Build parametrizado por --env target=chrome|firefox
```

## Como funciona a extração

1. **`encontrarTabelaHorario`** localiza o `<table>` cujo `<thead>` contém
   todos os dias da semana (de "Segunda" a "Domingo").
2. **`extrairGrade`** percorre as linhas do `<tbody>`, uma por horário
   (ex.: `07:00`, `07:50`, ...), e monta uma matriz `grade[dia][slot]` com o
   código da disciplina e a sala de cada célula.
3. **`extrairBlocos`** agrupa slots consecutivos do mesmo dia com o mesmo
   código de disciplina e sala em um único bloco de aula (evitando gerar um
   evento por hora quando a aula dura 2h, 3h etc.).
4. **`extrairDisciplinas`** varre o texto da página em busca do padrão
   `CÓDIGO - Nome da disciplina:` para montar um mapa código → nome completo,
   usado para enriquecer o título dos eventos.
5. **`gerarICS`** gera o arquivo iCalendar com um `VEVENT` recorrente
   (`RRULE:FREQ=WEEKLY`) por bloco de aula, usando o fuso horário fixo
   `America/Sao_Paulo` (UTC-3, sem horário de verão desde 2019) para não
   depender do fuso configurado no navegador do usuário.

## Qualidade de código

- **TypeScript em modo `strict`**, mais flags adicionais de rigor:
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`, `noImplicitOverride`.
- **ESLint** com `@typescript-eslint` (incluindo regras que exigem
  type-checking), `eslint-plugin-import` para ordenação de imports, e
  `eslint-config-prettier` para não conflitar com o Prettier.
- **Prettier** para formatação consistente.
- Nenhum uso de `any` implícito, sem asserções não-nulas (`!`), e acesso a
  índice de array sempre tratado como possivelmente `undefined`.

Rode `pnpm run typecheck && pnpm run lint` antes de qualquer release.

### Hooks de pré-commit

O projeto usa o [prek](https://prek.j178.dev) (compatível com o `pre-commit`
upstream) para rodar verificações antes de cada commit. Instale os shims uma
única vez com:

```bash
prek install
```

A partir daí o `prek` roda automaticamente nos estágios `pre-commit` e
`commit-msg`: limpeza de whitespace/EOF, validação de YAML/JSON, detecção de
segredos (gitleaks), Prettier, ESLint, `tsc --noEmit` e validação da mensagem de
commit (Conventional Commits via commitlint). Para rodar tudo manualmente:

```bash
prek run --all-files
```

## Fluxo de branches

- `master` é a branch de release e fica protegida: não aceita push direto,
  exige PR, exige os checks `Build & package` e `PR source is dev`, exige a
  branch atualizada com a `master` e proíbe force push/deleção.
- `dev` é a branch de integração. Features, fixes, docs e mudanças de CI
  entram nela primeiro.
- Releases são disparados por merges de PRs da `dev` na `master`. O PR aberto
  pelo próprio release-please (`release-please--*`) é a única exceção à regra
  de origem.

```text
feature/* ──PR──> dev ──PR──> master ──> release-please ──merge──> tag + release
```

## Releases

O versionamento é semântico (`v0.1.0`, `v0.1.1`, `v0.2.0`, ...) e automatizado
pelo [release-please](https://github.com/googleapis/release-please) a partir das
mensagens de commit no padrão
[Conventional Commits](https://www.conventionalcommits.org):

- `fix:` → patch
- `feat:` → minor
- `feat!:` / `BREAKING CHANGE:` → major (minor enquanto a versão for `0.x`)

Fluxo:

1. O trabalho é integrado na branch `dev`.
2. Um PR de `dev` para `master` roda `typecheck`, `lint` e o empacotamento; após
   o merge, o release-please abre/atualiza um PR de release com o `CHANGELOG.md`
   e o bump de versão (em `package.json` e `manifests/manifest.base.json`).
3. Ao mergear esse PR de release, o release-please cria a tag (`vX.Y.Z`) e a
   release no GitHub.
4. O workflow `.github/workflows/release.yml` então builda e anexa à release os
   pacotes `sig-ufla-exporter-chrome.zip` e `sig-ufla-exporter-firefox.zip`.

O workflow também roda `typecheck`, `lint` e o empacotamento em todo pull request
para garantir que os dois alvos continuam compilando.

## Decisões de design

- **Um único content script para os dois navegadores.** Como a API usada
  (`document`, `DOM`, `Blob`, `URL.createObjectURL`) é idêntica em Chrome e
  Firefox no contexto de um content script Manifest V3, não há necessidade de
  branches de código por navegador — só o manifest muda.
- **Merge de manifests em vez de dois manifests completos duplicados**, para
  eliminar o risco de as duas versões divergirem silenciosamente (que foi
  exatamente o que causou a duplicação de código original).
- **Webpack com `ts-loader`** em vez de `esbuild`/`swc`, para manter o
  type-checking como parte do próprio pipeline de build (falha o build se o
  TypeScript não compilar), já que a extensão é pequena e o tempo de build não
  é um gargalo.
