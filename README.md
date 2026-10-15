# Site institucional do Hesde

Protótipo navegável e interativo do site de lançamento do Hesde, feito a partir de [`PROMPT-CURSOR.md`](PROMPT-CURSOR.md). HTML, CSS e JavaScript puros, sem framework e sem etapa de build. Sem dependências externas: a fonte, Director UA, é um arquivo local.

## Como abrir

- **Direto do disco:** abra `index.html` no navegador.
- **Por HTTP** (recomendado para testar): na raiz do repositório, rode `py -m http.server 8080` (ou `python3 -m http.server 8080`) e acesse `http://localhost:8080`.
- **Sistema de design:** link "Sistema de design" no rodapé, ou abra a página com `#design-system` no fim do endereço.

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura e textos de todas as seções, sprite de ícones SVG, modais e o glossário (`<dl id="glossary">`, fonte dos tooltips) |
| `assets/styles.css` | Sistema de design: tokens em `:root`, tema escuro, componentes, seções, sistema de design e responsividade |
| `assets/app.js` | Interações. Um módulo `init*` por área, cada um em `try/catch`: um erro num módulo não derruba os outros |
| `assets/data.js` | Dados fictícios e a API simulada `HesdeApi`, única camada de dados da interface |
| `assets/fonts/` | Director UA em WOFF2 e a licença dela (`OFL.txt`) |

## O que é interativo

- **Hero:** mock do dashboard com contadores, gráfico que se desenha, badges em sequência, ponteiro simulado que abre o detalhe de cada achado, feed de eventos a cada 2,6 s e índice de exposição que oscila entre 68 e 61 a cada 9 s. Grade com deriva lenta e parallax com o ponteiro.
- **Ciclo de CTEM:** 8 etapas como abas, com avanço automático a cada 3,8 s enquanto a seção está visível; para na primeira interação.
- **Plataforma (7 abas):**
  - Dashboard com busca (ignora acentos), filtros de risco, ambiente e exposição, KPIs recalculados e painel de detalhes do ativo.
  - Audit com medidores de hardening e execução de auditoria com log linha a linha.
  - Validate com motor de política, aprovação humana (autoaprovação aceita só no laboratório), execução, detecção (com opção de simular detecção ausente) e evidência.
  - Escopo com verificação real de IPv4, CIDR, IPv4 mapeado em IPv6, zeros à esquerda e DNS simulado.
  - Trilha de auditoria com verificação da corrente e da âncora, e simulação de edição e de reescrita.
  - Relatórios executivo e técnico com prévia em "papel".
  - Integrações que conectam e desconectam; o SOAR falha de propósito.
- **Antes e depois:** comparador com alça arrastável (input range acessível) em três temas.
- **Demais seções:** cards que expandem, linha de progresso de "Como funciona" e da faixa de segurança acompanhando o scroll, marquee de logos, carrossel com swipe, cobrança mensal/anual, tabela comparativa expansível, FAQ, formulário com validação em tempo real e tema claro/escuro.

## Dados e integração com backend

Toda a interface conversa só com `window.HesdeApi` (`assets/data.js`). Cada função é assíncrona e tem o formato de entrada e saída documentado em JSDoc. Para integrar um backend, troque o corpo das funções por chamadas HTTP mantendo os formatos.

| Função | Uso |
|---|---|
| `listAssets({query, severities, environment, onlyInternet})` | Tabela e KPIs do Dashboard |
| `getAsset(id)` | Painel de detalhes |
| `summary()` | Mock do hero |
| `listValidateTargets()`, `evaluatePolicy(targetId)`, `approve(targetId, {self})`, `runValidation(targetId, {detected})` | Aba Validate |
| `getScope()`, `checkScope(value)` | Aba Escopo |
| `listAuditEvents({tamper})`, `verifyAuditTrail({tamper})` | Aba Trilha de auditoria |
| `hardeningCoverage()`, `runAudit()` | Aba Audit |
| `generateReport(kind)` | Aba Relatórios |
| `connectIntegration(id)`, `disconnectIntegration(id)` | Aba Integrações |
| `submitContact(payload)` | Formulário de contato |
| `settings.latency`, `settings.failSubmit` | Latência simulada e falha forçada do envio (o switch "Simular falha no envio" fica no sistema de design) |

Regras dos dados fictícios: IPs só de `192.0.2.0/24`, `198.51.100.0/24` e `203.0.113.0/24` (RFC 5737), domínios só de `empresa.example`, organização "Empresa Exemplo S.A." e nenhuma credencial exibida, nem falsa.

## Espaços reservados

Procure no `index.html` por:

- `[ESPAÇO DA MARCA]`: logotipo oficial no header e no rodapé, e os slots do bloco 17 do sistema de design (logotipo, símbolo do favicon e do app, fotografia).
- `[ESPAÇO RESERVADO]`: logos de clientes e parceiros (marquee) e depoimentos (carrossel). Substituir só com autorização por escrito e de uso de marca.
- `[a definir]`: URL canônica, Política de Privacidade, Termos e links das redes sociais.

## Fontes

O site inteiro usa a **Director UA 400** (`assets/fonts/DirectorUA-Regular.woff2`): wordmark, títulos, texto, interface, logs e códigos. Ela é monoespaçada e só tem o peso Regular, então a hierarquia vem de tamanho, cor e caixa alta, sem negrito.

- **Director UA**, de Ange Degheest, May Jolivet e Justine Herbel, publicada pela [Velvetyne Type Foundry](http://www.velvetyne.fr/) sob a SIL Open Font License 1.1. O WOFF2 é só a conversão de formato do TTF original, sem glifos removidos, e a licença acompanha o arquivo em `assets/fonts/OFL.txt`, como a OFL exige.
- Para trocar a fonte, substitua o arquivo em `assets/fonts/` e ajuste o `@font-face` no topo de `assets/styles.css` e as variáveis `--font-display`, `--font-sans` e `--font-mono`. Como a escala e os pontos de quebra foram calibrados para uma fonte larga, confira o layout em várias larguras depois da troca.
- Aberto direto do disco (`file://`), alguns navegadores bloqueiam fontes locais; nesse caso o texto cai na fonte monoespaçada do sistema. Por HTTP a fonte carrega normalmente.

## Acessibilidade e movimento

- Contraste AA medido nos dois temas. O sistema de design mostra a razão de cada par, calculada ao vivo no tema ativo.
- Severidade sempre com cor, ícone e rótulo. Abas, acordeão, carrossel, modal, switch e grupos de rádio seguem os padrões ARIA e funcionam pelo teclado.
- Com `prefers-reduced-motion`, nenhum laço roda e os estados finais aparecem direto. Os laços também pausam fora da tela e com a aba oculta.

## Orçamento

Sem minificar: `styles.css` com 89 KB (limite de 90 KB) e `app.js` com 69 KB (limite de 80 KB). O `data.js` (35 KB) é a camada de dados com JSDoc e fica fora dessa conta; somado ao `app.js`, o JavaScript passa do limite.

## Pendências

- Logotipo oficial, logos e depoimentos reais, textos legais e URLs definitivas.
- Teste manual no Firefox e no Safari. O protótipo foi verificado no Chromium, em 375, 1.280 e 1.440 px, nos dois temas e com movimento reduzido.
