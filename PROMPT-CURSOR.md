# Prompt — Site institucional do Hesde

Crie o site institucional interativo do **Hesde**, uma plataforma de cibersegurança corporativa. O resultado deve parecer o site de lançamento de um produto pronto: corporativo, editorial, minimalista, vivo e tecnicamente preciso.

**Stack:** HTML, CSS e JavaScript puros, sem framework e sem etapa de build. Estrutura de arquivos:

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura e textos |
| `assets/styles.css` | Sistema de design: tokens, temas claro e escuro, componentes e responsividade |
| `assets/app.js` | Interações. Um módulo `init*` por área da página, cada um isolado: um erro num módulo não derruba os outros |
| `assets/data.js` | Dados fictícios e a API simulada `HesdeApi`, única camada de dados da interface, pronta para ser trocada por um backend |
| `README.md` | Como abrir, estrutura, onde estão os placeholders e como integrar um backend |

---

## 1. O produto

O Hesde é uma plataforma brasileira de cibersegurança corporativa, com núcleo em Rust, para:

- auditoria;
- gestão contínua de exposições (CTEM);
- hardening;
- análise de vulnerabilidades e segredos;
- validação segura de riscos.

Tem dois módulos:

- **Hesde Audit:** auditoria e inventário, somente leitura por padrão.
  - Hardening de Linux, Windows, Active Directory, nuvem, containers e Kubernetes.
  - Vulnerabilidades e segredos; análise de configurações.
  - Relatórios técnicos e executivos.
- **Hesde Validate:** validação segura e não destrutiva de riscos.
  - Purple Team com MITRE ATT&CK; verificação de detecção no SIEM e no EDR.
  - Cada execução exige aprovação humana e respeita um escopo aprovado.

**Público:** SOC e segurança, auditoria interna e GRC, infraestrutura, Technology Risk, desenvolvimento e AppSec, gestores de TI e C-level.

**Conceitos do produto que o site deve refletir com precisão:**

- **Escopo** versionado e aprovado. As exclusões sempre prevalecem sobre as inclusões.
- **Autorização formal**, com vigência, janelas de teste, ambientes permitidos e nível máximo de atividade.
- **Níveis de atividade de N0 a N3.**
  - N3 (validação ativa) sempre exige aprovação humana.
  - Fora do laboratório, quem aprova não pode ser quem executa.
  - No laboratório, uma dispensa de segregação registrada permite a autoaprovação.
- **Motor de política** que decide cada atividade antes de ela acontecer.
  - Resultado: `permitir`, `exigir aprovação` ou `negar`, sempre com códigos de motivo (seção 2.2).
  - Quando permite, emite uma concessão válida por até 10 minutos.
  - A aprovação de N3 vale para um pedido exato (resumo SHA-256 do pedido) por até 1 hora.
  - Fora do laboratório, a aprovação é assinada (Ed25519) pela instalação de um segundo operador.
- **Trilha de auditoria** append-only, encadeada por hash, com âncoras assinadas (Ed25519) e verificação offline. Uma reescrita da trilha, mesmo com os hashes recalculados, deixa de bater com a âncora.
- **Segredos:** os encontrados são mascarados antes de qualquer gravação. O Hesde nunca testa se uma credencial funciona; a recomendação é sempre rotacionar.
- **Dados:** cifrados por cliente, com chave no cofre do sistema operacional e destruição criptográfica ao encerrar.
- **Prazos de correção** por severidade, ajustáveis: Crítico 7 dias, Alto 30, Médio 90, Baixo 180.
- **Relatórios** com a classificação "CONFIDENCIAL · TLP:AMBER+STRICT" e manifesto assinado.
- **Garantias de fabricação:** nenhuma telemetria de produto, SBOM de cada versão, releases assinadas e código inseguro (`unsafe`) proibido.

---

## 2. Regras inegociáveis

### 2.1 Conteúdo

- Todo o texto em português do Brasil: profissional, direto e orientado a valor, sem superlativos e sem afirmações sem suporte.
- Não invente clientes, depoimentos, logos, métricas numéricas de mercado, preços, certificações, prazos de atendimento nem garantias de conformidade. Onde faltar conteúdo real, use placeholders marcados como `[ESPAÇO RESERVADO]`.
- Ao falar de LGPD, diga "apoiando o atendimento à LGPD", nunca "atende" ou "garante".

### 2.2 Códigos de motivo e nomes de evento

As simulações usam **somente** estes códigos de motivo do motor de política:

| Código | Efeito | Significado |
|---|---|---|
| `target.in_scope` | Informativo | O alvo casou com o escopo |
| `target.partially_excluded` | Informativo | O alvo contém exclusões, que continuam bloqueadas |
| `approval.required` | Exige aprovação | N3 sem aprovação |
| `target.excluded` | Nega | Uma exclusão cobre o alvo |
| `target.not_in_scope` | Nega | Nenhuma inclusão cobre o alvo |
| `target.invalid` | Nega | Valor inválido para o tipo de alvo |
| `level.exceeds_target` | Nega | Nível pedido acima do teto da entrada do escopo |
| `approval.self_approval` | Nega | Quem aprova é quem executa, fora da dispensa de laboratório |
| `dns.resolved_excluded` | Nega | O nome resolveu para um endereço excluído |

Nomes de ação da trilha de auditoria seguem o formato `dominio.acao`, em snake_case. Use estes:

- `engagement.create`
- `scope.approve`
- `authorization.create`
- `session.start`
- `policy.decision`
- `finding.transition`
- `session.finish`

### 2.3 Segurança do conteúdo (Validate)

Nunca descreva, sugira ou ilustre:

- negação de serviço, ransomware, cifragem ou destruição de dados, exfiltração;
- roubo ou captura de credenciais, tokens ou cookies; phishing;
- persistência, movimento lateral real, exploração de vulnerabilidades, payloads, malware ou C2;
- evasão de EDR, AV, WAF, MFA ou SIEM, bypass de autenticação, força bruta, limpeza de rastros.

As validações mostradas são sempre benignas e detectáveis. Exemplos permitidos:

- login com conta de teste autorizada;
- evento benigno com marcador único, para correlacionar no SIEM;
- verificação de versão e de configuração.

### 2.4 Dados fictícios

- **IPs:** somente das faixas de documentação (RFC 5737): `192.0.2.0/24`, `198.51.100.0/24` e `203.0.113.0/24`. IPv6 só como IPv4 mapeado (`::ffff:192.0.2.1`).
- **Domínios:** somente o reservado `empresa.example` e seus subdomínios (ex.: `dc-01.empresa.example`).
- **Organização:** "Empresa Exemplo S.A.".
- **Segredos:** nenhuma credencial, chave ou token aparece, nem falso. Mostre sempre `••••••••••••` mais o tipo.

### 2.5 Acessibilidade (WCAG 2.2 AA)

- **Contraste:**
  - 4,5:1 para texto normal;
  - 3:1 para texto grande (≥ 24 px, ou ≥ 18,66 px em negrito) e para componentes de interface.
- Foco sempre visível; tudo operável por teclado; landmarks e hierarquia de títulos corretas.
- Padrões ARIA completos para abas, acordeão, carrossel, diálogo, switch e grupos de rádio.
- **Cor nunca é o único indicador:** severidade sempre com cor, ícone e rótulo escrito.
- Alvos de toque de pelo menos 44 × 44 px no mobile.
- `prefers-reduced-motion` respeitado em tudo: sem laços automáticos, com estados finais aparecendo direto.

### 2.6 Performance

- Anime só `transform` e `opacity`. Reserve espaço para tudo que carrega, sem layout shift.
- Pause laços animados quando estiverem fora da tela ou com a aba oculta (IntersectionObserver e `visibilitychange`).
- Nenhuma imagem raster: ícones e ilustrações em SVG inline.
- A única dependência externa é o Google Fonts. A fonte mono é um arquivo local em `assets/fonts/`.
- Orçamento sem minificar: CSS ≤ 90 KB, JS ≤ 80 KB.

---

## 3. Identidade visual HESDE

A identidade HESDE é a única do site, nos temas claro e escuro.

### 3.1 Paleta da marca

| Nome | Hex | Papel no site |
|---|---|---|
| HESDE Burgundy | `#340C0E` | Cor primária: wordmark, botões, links, rótulos de seção, foco (tema claro) e faixa da seção Segurança |
| Signature Red | `#CC383E` | Só em momentos de marca: faixa do CTA final e amostra no sistema de design |
| HESDE Light | `#F8C6C8` | Texto sobre burgundy, primária do tema escuro, seleção de texto e detalhes (~5%) |
| Ivory | `#F3EFE8` | Fundo principal do tema claro; texto do tema escuro |
| Charcoal | `#191718` | Texto do tema claro; fundo do tema escuro e do rodapé |

**Proporção na interface:**

| Grupo | Proporção |
|---|---|
| Neutros (ivory, charcoal e derivados) | ~70% |
| Burgundy | ~20% |
| HESDE Light | ~5% |
| Signature Red | ~3–5% |

O vermelho de "Crítico" precisa ser inconfundível. Por isso o Signature Red fica fora de toda a interface de produto.

### 3.2 Tipografia

- **Bodoni Moda 500:** wordmark e títulos editoriais (H1, H2, título do CTA, numerais grandes). Nunca abaixo de 28 px.
- **Geist 400/500/600:** texto, navegação, UI e títulos H3/H4.
- **Director UA 400:** logs, hashes, códigos de motivo, endereços. Monoespaçada, da Velvetyne Type Foundry, sob a SIL OFL 1.1; arquivo local em WOFF2, com a licença ao lado (`assets/fonts/OFL.txt`). Só tem o peso 400: não pedir negrito nela.
- **Números** de KPIs e tabelas com `font-variant-numeric: tabular-nums`.

### 3.3 Logotipo

- **Wordmark tipográfico:** "HESDE" em Bodoni Moda 500, caixa alta, `letter-spacing: 0.28em`. Burgundy no tema claro; Ivory no escuro e no rodapé.
- **Espaço para o logo oficial:** comentário `[ESPAÇO DA MARCA] Substituir pelo SVG oficial do logotipo` no header e no rodapé.
- **Regras de uso:** não esticar, não aplicar sombra nem efeito, respeitar área de proteção igual à altura da letra "H".
- **Favicon:** SVG inline (data URI) com a letra "H" em Bodoni, burgundy sobre ivory.

### 3.4 Voz

Confiante, inteligente e concisa. Frases curtas, sem exclamações, sem superlativos ("o melhor", "revolucionário") e sem promessas não comprováveis.

### 3.5 Linguagem gráfica

Grids arquitetônicos, linhas técnicas finas (1 px), marcas de medida (réguas com ticks), tipografia editorial grande e muito espaço em branco.

**Proibido:**

- visual "hacker", neon ou terminal exagerado;
- gradientes chamativos ou glassmorphism pesado;
- ilustrações infantis e decoração sem função;
- cursor customizado.

---

## 4. Design tokens

Defina tudo como custom properties em `:root`.

- O tema claro é o padrão.
- O escuro fica em `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` **e** em `:root[data-theme="dark"] {…}`.
- O `body` sempre tem `background: var(--bg)` explícito.

### 4.1 Cores — tema claro

```css
/* Marca */
--brand-burgundy: #340C0E;
--brand-red: #CC383E;
--brand-light: #F8C6C8;
--brand-ivory: #F3EFE8;
--brand-charcoal: #191718;

/* Neutros */
--bg: #F3EFE8;          /* Ivory: fundo principal */
--bg-alt: #ECE6DC;      /* seções alternadas */
--surface: #FBF9F5;     /* cards, shell da plataforma, modais */
--surface-2: #F5F1EA;   /* hover, cabeçalho de tabela, trilho de segmentado */
--ink: #191718;         /* texto principal */
--ink-2: #3A3234;       /* texto secundário, lead */
--muted: #6B6163;       /* legendas (5,2:1 no Ivory; 4,8:1 no bg-alt) */
--line: #E2DBD0;        /* bordas e divisórias */
--line-strong: #CFC5B7; /* bordas de inputs, hover de cards */
--grid-line: rgba(52, 12, 14, 0.06);

/* Primária */
--primary: #340C0E;
--primary-hover: #4A1316;
--primary-ink: #F8C6C8;  /* texto sobre a primária (11,5:1) */
--primary-soft: #F6E3E1; /* fundo de ícones, chips de marca, linha selecionada */
--focus: #340C0E;
--selection-bg: #F8C6C8;
--selection-ink: #340C0E;

/* Severidade: texto | fundo suave | borda | gráfico */
--crit: #B42318;  --crit-soft: #FDECEA;  --crit-line: #F5C2BC;  --crit-chart: #D92D20;
--high: #B54708;  --high-soft: #FEF0E6;  --high-line: #F9CDA9;  --high-chart: #EF6820;
--mid:  #8A5A00;  --mid-soft:  #FDF5DC;  --mid-line:  #F0D896;  --mid-chart:  #DCA00B;
--low:  #55606E;  --low-soft:  #ECEEF1;  --low-line:  #CDD3DB;  --low-chart:  #98A2B3;
--info: #1F5FCC;  --info-soft: #E6EEFB;  --info-line: #BCD0F5;  --info-chart: #3B7BE8;
--ok:   #157A42;  --ok-soft:   #E4F3EA;  --ok-line:   #B5DEC5;  --ok-chart:   #2E9E5B;

/* Faixas especiais */
--band-security-bg: #340C0E;
--band-security-ink: #F3EFE8;
--band-security-muted: #D9B8B9;
--band-security-line: rgba(248, 198, 200, 0.18);
--band-cta-bg: #CC383E;
--band-cta-ink: #F3EFE8;
--footer-bg: #191718;
--footer-ink: #F3EFE8;
--footer-muted: #A99D98;
```

### 4.2 Cores — tema escuro

```css
--bg: #191718;
--bg-alt: #1E1B1C;
--surface: #221E1F;
--surface-2: #2A2526;
--ink: #F3EFE8;
--ink-2: #DDD5CB;
--muted: #A99D98;       /* 6,2:1 na surface */
--line: #342D2E;
--line-strong: #463D3E;
--grid-line: rgba(248, 198, 200, 0.05);
--primary: #F8C6C8;
--primary-hover: #FBD8D9;
--primary-ink: #340C0E;
--primary-soft: rgba(248, 198, 200, 0.12);
--focus: #F8C6C8;
--selection-bg: rgba(248, 198, 200, 0.30);
--selection-ink: #F3EFE8;

/* Severidade: o mesmo hex serve para texto e gráfico; fundo com 14% de alfa; borda com 30% */
--crit: #F97066;
--high: #F38744;
--mid:  #F5C451;
--low:  #A3AEC1;
--info: #7AA4F7;
--ok:   #47CD89;

--band-security-bg: #2A0A0C;
--band-cta-bg: #CC383E;   /* mantém o vermelho; título em Ivory */
--footer-bg: #131112;     /* com borda superior var(--line) */
```

As sombras no tema escuro usam `rgba(0, 0, 0, 0.4–0.7)`.

### 4.3 Regras de uso de cor

1. **Rótulos de seção (eyebrows):** burgundy no claro e HESDE Light no escuro. Nunca em vermelho: Signature Red sobre Ivory dá 4,36:1, abaixo de AA para texto pequeno.
2. **Signature Red:** só na faixa do CTA final. Nunca em texto menor que 24 px, nunca perto de badges de severidade.
3. **Cores de severidade:** só para estados de risco (badges, KPIs de risco, gráficos de distribuição, linhas de log de achados). Nunca para decoração, tags de marketing ou botões.
4. **Severidade em tripla codificação** (cor, ícone e rótulo):

   | Severidade | Ícone |
   |---|---|
   | Crítico | Octógono com "!" |
   | Alto | Triângulo com "!" |
   | Médio | Círculo com "!" |
   | Baixo | Círculo com "–" |
   | Informativo | Círculo com "i" |
   | Conforme | Círculo com check |

5. **Gráficos neutros** (tendência, índice de exposição): linha em `--primary`, área em `--primary-soft`. A distribuição por severidade usa as cores `*-chart`.
6. **Tendências:**
   - a boa (índice de exposição caindo, controles subindo) vai em `--ok`;
   - a ruim vai em `--crit`;
   - ambas sempre com seta e texto.
7. **Verificação:** confira cada par texto/fundo com um script de contraste e ajuste o que ficar abaixo de AA.

### 4.4 Tipografia (escala)

| Token | Fonte | Tamanho / altura de linha | Uso |
|---|---|---|---|
| `--t-display` | Bodoni Moda 500, tracking −0,01em | `clamp(2.5rem, 1.6rem + 3.2vw, 4.5rem)` / 1,04 | H1 do hero |
| `--t-h2` | Bodoni Moda 500 | `clamp(2rem, 1.4rem + 2vw, 3rem)` / 1,1 | Títulos de seção, CTA |
| `--t-numeral` | Bodoni Moda 500 | 3rem / 1 | Numerais "01–04" |
| `--t-h3` | Geist 600 | 1.25rem / 1,35 | Títulos de card |
| `--t-h4` | Geist 600 | 1rem / 1,4 | Subtítulos de painel |
| `--t-lead` | Geist 400 | 1.1875rem / 1,6, máx. 60ch, cor `--ink-2` | Subtítulos de seção |
| `--t-body` | Geist 400 | 1.0625rem / 1,65 | Texto corrido |
| `--t-ui` | Geist 500 | 0.9375rem / 1,4 | Botões, abas, tabelas |
| `--t-small` | Geist 400 | 0.875rem / 1,5 | Notas, legendas |
| `--t-eyebrow` | Geist 600 | 0.75rem, caixa alta, tracking 0,14em, cor `--primary` | Rótulos de seção |
| `--t-mono` | Director UA 400 | 0.8125rem / 1,6 | Logs, hashes, códigos |

**Carregamento:** Google Fonts com `preconnect` e `display=swap`:

- Bodoni Moda (opsz 6..96, peso 500);
- Geist (400, 500, 600).

A Director UA vem de `assets/fonts/DirectorUA-Regular.woff2` por `@font-face`, com `font-display: swap`. Ela é 0,70 em de largura por caractere (a Geist Mono era 0,60 em): colunas com texto mono longo precisam quebrar linha.

**Fallbacks:**

- Bodoni: `"Bodoni 72", Didot, Georgia, serif`;
- Geist: `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`;
- Director UA: `ui-monospace, Menlo, Consolas, monospace`.

### 4.5 Espaçamento, grade, forma e movimento

- **Espaçamento** (ritmo de 8 px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Seções:** padding vertical de 128 px no desktop, 96 no tablet e 72 no mobile.
- **Contêiner:** largura máxima de 1.200 px; margem lateral de 32 px (desktop), 24 (tablet) e 16 (mobile). Grade de 12 colunas, gutter de 24 px.
- **Breakpoints:**
  - 1100 px: o nav vira menu;
  - 900 px: grades de 3 viram 2 e as timelines ficam verticais;
  - 600 px: uma coluna.
- **Raios:**
  - `--radius-s: 4px`: inputs, badges quadrados;
  - `--radius: 8px`: botões, cards;
  - `--radius-l: 12px`: shell da plataforma, modais, mock do hero;
  - `999px`: chips e badges.
- **Sombras** (tom quente, tema claro):
  - `--shadow-1: 0 1px 2px rgba(25,23,24,.05)`;
  - `--shadow-2: 0 10px 28px -14px rgba(25,23,24,.22), 0 2px 6px rgba(25,23,24,.05)`;
  - `--shadow-3: 0 30px 60px -30px rgba(25,23,24,.35), 0 6px 16px rgba(25,23,24,.06)`.
- **Movimento:**
  - durações: `--dur-fast: 120ms` (cor), `--dur: 220ms` (botões, cards, abas), `--dur-slow: 360ms` (revelação, painéis);
  - curva: `--ease: cubic-bezier(.2,.7,.2,1)`;
  - nenhuma animação de interface acima de 600 ms, exceto contadores (1.200 ms) e laços ambientes do hero.
- **Scrollbar:** fina (10 px), polegar `--line-strong` com hover `--muted`, trilho transparente.
- **Seleção de texto:** `--selection-bg` e `--selection-ink`.

---

## 5. Componentes

Todos reutilizáveis, por classe, com estados completos.

- **Botões:**
  - Alturas de 36 px (sm), 44 (md) e 52 (lg).
  - Primário:
    - fundo `--primary`, texto `--primary-ink`;
    - hover em `--primary-hover` com `translateY(-1px)`; ativo em `scale(.98)`.
  - Secundário: fundo transparente, borda de 1 px `--line-strong`, texto `--ink`, hover `--surface-2`.
  - Discreto: texto `--primary`, com sublinhado animado no hover.
  - Foco: anel de 2 px `--focus` com offset de 2 px.
  - Carregando: spinner no lugar do rótulo, mantendo a largura, com `aria-busy`.
  - Desativado: opacidade .45.
- **Links:** cor `--primary`, sublinhado animado (`background-size` de 0 a 100%, 220 ms).
- **Cards:**
  - fundo `--surface`, borda de 1 px `--line`, raio 8, padding 28;
  - hover: `translateY(-3px)`, `--shadow-2` e borda `--line-strong`;
  - tile de ícone de 40 × 40, fundo `--primary-soft`, ícone `--primary`; no hover, o ícone redesenha o traço (stroke-dashoffset, 600 ms).
- **Badges de severidade:**
  - altura 24, padding 0 8, raio 999, Geist 600 12 px;
  - ícone de 12 px mais rótulo;
  - fundo `*-soft`, texto `*`, borda `*-line`.
- **Chips:**
  - neutros: fundo `--surface-2`, borda `--line`, texto `--ink-2`;
  - de marca: fundo `--primary-soft`, texto `--primary`;
  - de filtro: `aria-pressed`, com borda `--primary` e fundo `--primary-soft` quando ativos.
- **Inputs:**
  - label flutuante, altura 52, borda `--line-strong`, fundo `--surface`;
  - foco: borda `--primary` mais anel;
  - inválido: borda `--crit`, mensagem com ícone e `aria-invalid`;
  - válido: borda `--ok` e ícone de check;
  - textarea com contador de caracteres.
- **Outros controles:**
  - select, checkbox e radio-chips;
  - switch de 36 × 20, ligado em `--primary`;
  - segmentado com trilho `--surface-2`; opção ativa em `--surface` com `--shadow-1`.
- **Tabelas:**
  - cabeçalho em 12 px, caixa alta, `--muted`, sobre `--surface-2`;
  - linhas de 56 px, hover `--surface-2`;
  - linha selecionada com fundo `--primary-soft` e barra esquerda de 2 px `--primary`;
  - números em mono tabular;
  - linhas clicáveis operáveis por teclado (Enter e espaço).
- **Abas:**
  - indicador de 2 px `--primary` que desliza;
  - teclado: setas, Home e End;
  - o painel entra com fade e `translateY(8px)` em 220 ms;
  - no mobile, rolagem horizontal com máscara de fade nas bordas.
- **Acordeão:** animação com `grid-template-rows: 0fr → 1fr` (260 ms); chevron gira 180°.
- **Modal:**
  - largura máxima de 520, raio 12;
  - fundo `rgba(25,23,24,.5)` com blur de 4 px;
  - prende o foco, fecha com Esc e devolve o foco ao gatilho;
  - entra com opacidade e escala de .98 a 1.
- **Toasts:**
  - posição: canto inferior direito no desktop, centralizado embaixo no mobile;
  - visual: fundo `--surface`, barra esquerda de 3 px na cor do tipo (info, ok ou crit) e ícone;
  - somem em 4,2 s; no máximo 3 ao mesmo tempo;
  - `role="status"`, ou `alert` para erro.
- **Tooltip de glossário:**
  - fundo `--ink`, texto `--bg`, 13 px, largura máxima de 280;
  - abre no hover (ponteiro fino), no foco e no toque; fecha com Esc, clique fora ou rolagem;
  - termos: CTEM, EPSS, KEV, MITRE ATT&CK, SIEM, SOAR, GRC, SSO, RBAC, Hardening, SBOM e N0–N3.
- **Estados:**
  - skeleton: shimmer entre `--surface-2` e `--line` (1,2 s); estático com movimento reduzido;
  - vazio: ícone de 32 px `--muted`, título, texto e ação;
  - erro: alerta com borda `--crit-line`, fundo `--crit-soft`, ícone e ação de tentar de novo;
  - sucesso: check em SVG que se desenha (stroke, 500 ms) em `--ok`.
- **Timeline:** linha de 1 px `--line-strong`, progresso em `--primary`, pontos de 12 px (preenchido quando concluído, com anel quando atual).
- **Gráficos:**
  - SVG ou CSS, sem biblioteca: barra empilhada, sparkline, barras verticais e medidor;
  - todos com `aria-hidden` e o dado equivalente em texto.

---

## 6. Seções do site

Página única com âncoras, na ordem abaixo. Os fundos alternam como indicado.

### 6.1 Header fixo

- **Fundo:**
  - claro: `rgba(243,239,232,.82)` com `backdrop-filter: blur(12px)`;
  - escuro: `rgba(25,23,24,.82)`.
- **Ao rolar mais de 12 px:** a altura passa de 72 para 60 px, com borda inferior `--line` e `--shadow-1` (transição de 220 ms).
- **Conteúdo:**
  - wordmark HESDE à esquerda;
  - nav: Produto, Plataforma, Segurança, Recursos, Preços, Documentação, Contato;
  - à direita, o alternador de tema (ícones lua e sol, `aria-label` dinâmico) e o botão primário sm "Solicitar demonstração".
- **Links do nav:**
  - Geist 500 de 15 px em `--ink-2`, hover `--ink`;
  - seção ativa marcada por uma barra de 2 px `--primary` que desliza sob o link, com `aria-current`;
  - "Documentação" abre o modal "Documentação em preparação".
- **Mobile (abaixo de 1100 px):**
  - botão hambúrguer;
  - o menu desce com slide e fade (220 ms), trava a rolagem do body, fecha com Esc e põe o foco no primeiro link;
  - itens de 56 px separados por `--line`, com o botão primário de largura total no fim.
- **Tema sem flash:** um script inline no `<head>` aplica o tema salvo antes da pintura (localStorage em try/catch).

### 6.2 Hero (fundo `--bg`)

- **Layout:** duas colunas (texto em 5/12, mock em 7/12). Abaixo de 900 px, uma coluna, com o mock depois do texto.
- **Fundo:**
  - grade arquitetônica de 64 px em `--grid-line`;
  - réguas finas com ticks a cada 8 px no topo e na lateral esquerda;
  - deriva muito lenta (60 s);
  - parallax de até ±8 px com o ponteiro, só em desktop.
- **Textos:**
  - eyebrow: "Gestão contínua de exposições";
  - H1: "Gestão contínua de exposições e riscos de segurança para empresas.";
  - lead: "O Hesde identifica, prioriza e ajuda a validar riscos em infraestrutura, aplicações, nuvem e identidade. Cada decisão vem com evidência, e cada atividade respeita o escopo autorizado.";
  - botões: primário lg "Solicitar demonstração" (vai ao formulário) e secundário lg "Conhecer a plataforma →" (vai a `#plataforma`);
  - indicadores em chips neutros: Auditoria · CTEM (com glossário) · Hardening · Purple Team · Rust Core.
- **Entrada:** eyebrow, título, lead, botões e chips em sequência (fade e `translateY(12px)`, intervalos de 60 ms).
- **Mock do dashboard:** `--surface`, raio 12, `--shadow-3`, `role="img"` com descrição.
  - Barra superior: mini wordmark, "CTEM contínuo · Empresa Exemplo S.A." e "Sessão em execução" com um ponto `--ok` pulsando.
  - Trilho lateral de ícones: visão geral, ativos, achados, validação e relatórios.
  - KPIs, contando de 0 ao entrar na tela:
    - "Índice de exposição": 68/100, com "▼ 4 na semana" em `--ok`;
    - "Exposições críticas": 4, em `--crit`, com "2 validadas";
    - "Controles conformes": 87%, com "▲ 3 p.p." em `--ok`.
  - Gráfico "Exposições por severidade · últimos 30 dias":
    - barra empilhada que se preenche (crítico 12%, alto 24%, médio 34%, baixo 30%);
    - sparkline em `--primary` que se desenha.
  - Lista de achados, com badges entrando em sequência (intervalos de 260 ms):
    - Crítico · Contas privilegiadas sem MFA · dc-01;
    - Crítico · VPN fora do suporte · vpn-borda-01;
    - Alto · Banco acessível da rede de usuários · db-clientes-01;
    - Médio · Certificado expira em 12 dias · portal.
  - Um ponteiro simulado percorre as linhas e abre um mini detalhe ("Prioridade 1 · Corrigir em 7 dias · ativo crítico · sem MFA").
  - Feed de eventos em mono: um novo a cada 2,6 s, no máximo 3 visíveis. Exemplos:
    - `policy.decision permitir · target.in_scope · N2`;
    - `policy.decision negar · target.excluded · 192.0.2.1`;
    - "segredo mascarado antes de gravar";
    - "âncora seq 1.284 assinada (Ed25519)".
  - O índice cai de 68 até 61 e volta, a cada 9 s.
  - Legenda "Dados fictícios" no canto.
  - Os laços pausam fora da tela. Com movimento reduzido, tudo aparece no estado final.

### 6.3 Problema (fundo `--bg`)

- **Textos:**
  - eyebrow: "O problema";
  - H2: "Vulnerabilidades não são o problema. Falta de contexto é.";
  - lead: "Times de segurança recebem milhares de alertas, CVEs e relatórios por mês, quase sempre sem uma ordem clara do que corrigir primeiro. O resultado é esforço alto, risco que continua e pouca evidência para mostrar à gestão e à auditoria."
- **Três cards** em grid de 3, com hover elevado e ícone que redesenha:
  1. "Excesso de falsos positivos": "Ferramentas que reportam tudo como urgente consomem horas de triagem e escondem o que de fato importa."
  2. "Prioridade sem risco de negócio": "Uma nota CVSS alta num servidor isolado pesa o mesmo que numa VPN exposta. Sem contexto do ativo, a fila fica errada."
  3. "Controles sem comprovação": "EDR, SIEM e políticas existem, mas ninguém consegue demonstrar com evidência se detectam e bloqueiam o que deveriam."

### 6.4 Solução (fundo `--bg-alt`)

- **Textos:**
  - eyebrow: "A solução";
  - H2: "Do inventário à decisão de segurança.";
  - lead: "O Hesde segue o ciclo de CTEM: cada etapa alimenta a próxima, e cada achado técnico vira uma decisão prática, com responsável, prazo e evidência."
- **Linha do tempo interativa:** horizontal no desktop, vertical abaixo de 900 px.
  - As 8 etapas funcionam como `role="tab"`, com uma linha de progresso em `--primary` que avança.
  - Clique, hover (ponteiro fino), setas, Home e End trocam a etapa.
  - Avanço automático a cada 3,8 s, só com a seção visível; para na primeira interação; desligado com movimento reduzido.
  - O card abaixo mostra "Etapa N de 8", título, texto e o chip "Saída: …", com transição de fade.

| Etapa | Texto | Saída |
|---|---|---|
| Descobrir | Encontra hosts, serviços, nomes e contas dentro do escopo aprovado. Cada conexão é conferida antes de sair, e nada fora do escopo é tocado. | Observações |
| Inventariar | Correlaciona o que foi visto num inventário único, com histórico, responsáveis e criticidade de 1 a 5 para cada ativo. | Ativos |
| Identificar exposições | Aplica regras versionadas de hardening, vulnerabilidades e segredos sobre as observações, sem voltar ao ambiente. | Achados |
| Priorizar risco | Combina severidade, exposição, criticidade do ativo, EPSS e KEV numa fila explicável. Nunca só pelo CVSS. | Fila priorizada |
| Validar com segurança | Confirma, com aprovação humana e ações não destrutivas, se a exposição é real. Fora do laboratório, quem aprova não executa. | Evidência |
| Detectar | Verifica no SIEM e no EDR se a validação foi detectada e alertada, e em quanto tempo. | Cobertura de detecção |
| Corrigir | Leva a correção ao time responsável, com prazo pela severidade e integração com o ticketing. | Plano de ação |
| Revalidar | Uma nova verificação confirma a correção. Um achado só fecha com evidência de que passou, nunca pela ausência de dado. | Tendência |

### 6.5 Produto (fundo `--bg`)

- **Textos:**
  - eyebrow: "Produto";
  - H2: "Dois módulos. Um ciclo contínuo de redução de risco.";
  - lead: "O Audit mostra onde você está exposto. O Validate confirma, com segurança e autorização, se a exposição é real e se os seus controles a detectam."
- **Dois cards grandes** lado a lado, cada um com tile de ícone, título, tag em chip de marca (nunca em cor semântica), checklist e o link "Ver na plataforma →", que rola até `#plataforma` e ativa a aba correspondente.

**Hesde Audit** · tag "Somente leitura por padrão":

- auditoria de sistemas e inventário de ativos;
- hardening de Linux, Windows, Active Directory, nuvem, containers e Kubernetes;
- detecção de vulnerabilidades e de segredos expostos;
- análise de configurações com regras versionadas;
- relatórios técnicos e executivos.

**Hesde Validate** · tag "Seguro e não destrutivo":

- validação segura e não destrutiva de riscos;
- evidências técnicas de cada execução;
- Purple Team com mapeamento MITRE ATT&CK;
- verificação de detecção no SIEM e no EDR;
- confirmação humana e controle rigoroso de escopo.

### 6.6 Plataforma interativa (fundo `--bg-alt`)

- **Textos:**
  - eyebrow: "Plataforma";
  - H2: "Experimente a interface.";
  - lead: "Uma simulação da plataforma com dados fictícios. Filtre ativos, confira o escopo, rode uma auditoria, acompanhe uma validação com aprovação humana e verifique a trilha de auditoria."
- **Shell do app:** `--surface`, borda `--line`, raio 12, `--shadow-2`.
- **Sete abas:** Dashboard · Hesde Audit · Hesde Validate · Escopo · Trilha de auditoria · Relatórios · Integrações.
- Toda chamada passa pela `HesdeApi`, com latência simulada e skeleton.
- Rodapé de cada aba: "Dados fictícios. Endereços e domínios reservados para documentação. Nenhuma credencial é exibida."

#### Aba Dashboard

- **KPIs:** Críticos, Altos e Médios (números na cor da severidade), "Ativos na visão" e um mini gráfico de barras com a distribuição. Recalculados a cada filtro, com contagem animada.
- **Barra de ferramentas:**
  - busca com debounce de 250 ms, que ignora acentos, em nome, endereço, tipo, responsável e títulos de achados;
  - chips de severidade (Crítico, Alto, Médio, Baixo, Conforme), com ícone e `aria-pressed`;
  - select de ambiente (Todos, Produção, Homologação, Desenvolvimento, Laboratório);
  - switch "Só expostos à internet".
- **Tabela de ativos:**
  - ordenada por prioridade (severidade máxima × 10 + criticidade);
  - colunas: Ativo (nome + endereço em mono), Tipo, Ambiente (+ chip "Internet"), Achados, Risco (badge);
  - skeleton de 5 linhas ao carregar.
- **Estado vazio:** "Nenhum ativo encontrado", com o botão "Limpar filtros".
- **Painel lateral de detalhes** ao clicar numa linha (no mobile, aparece abaixo da tabela):
  - fatos: ambiente, exposição, criticidade X de 5, prazo pela severidade, responsável e última coleta;
  - achados ordenados, cada um com badge, chips de fatores de risco e ação recomendada;
  - botão "Abrir chamado": toast de sucesso simulado;
  - botão "Validar com segurança": abre a aba Validate com o alvo pré-selecionado e mostra um toast.
- **Dados:** os ativos da seção 8.

#### Aba Hesde Audit

**Coluna esquerda: "Cobertura de hardening"**, com badge `info` "Somente leitura · N1".

- Medidores que se preenchem: Linux 82%, Windows 74%, Active Directory 61%, Nuvem 69%, Containers 77%, Kubernetes 58%.
- Nota: "Percentual de controles conformes por área, a partir de regras versionadas."

**Coluna direita: "Execução de auditoria".** O botão "Executar auditoria" mostra estado de carregamento, uma barra de progresso e um log em mono que vai aparecendo linha a linha. As linhas de achado levam ícone e cor de severidade:

```text
policy.decision · permitir · target.in_scope · N1
coleta · srv-erp-01 · configuração efetiva do sshd
[Alto] regra linux.ssh.permit_root_login · falhou
coleta · dc-01 · políticas de senha e MFA
[Crítico] regra windows.ad.privileged_mfa · falhou
coleta · portal · certificado e cabeçalhos HTTP
[Conforme] 1 segredo mascarado antes de gravar
[Conforme] regra linux.updates.security · passou · achado corrigido
âncora · seq 1.291 assinada (Ed25519)
```

Ao terminar, aparece o resultado: "Auditoria concluída sem alterar nenhum sistema. 3 achados novos, 1 corrigido e 1 segredo mascarado antes de gravar. Trilha encadeada e assinada." O botão passa a dizer "Executar de novo".

#### Aba Hesde Validate

**Pedido de validação:**

- select de alvo;
- fatos:
  - técnica: "MITRE ATT&CK T1078 · Contas válidas";
  - ação: "Login com conta de teste autorizada";
  - natureza: "Evento benigno e detectável, sem alteração";
  - nível: "N3 · exige aprovação";
- botão "Avaliar com o motor de política".

**Alvos e decisões esperadas:**

| Alvo | Decisão | Motivos | Comportamento |
|---|---|---|---|
| `lab-validate-01` · 203.0.113.20 · Laboratório | Exigir aprovação | `target.in_scope`, `approval.required` | Aceita autoaprovação, mostrando "Dispensa de segregação do laboratório registrada em 05/10/2026". A aprovação por outra pessoa também segue |
| `app-hml-02.empresa.example` · 192.0.2.140 · Homologação | Exigir aprovação | `target.in_scope`, `approval.required` | Autoaprovação **negada** com `approval.self_approval`: "Fora do laboratório, quem aprova não pode ser quem executa." A aprovação por um segundo operador segue |
| `dc-01.empresa.example` · 198.51.100.5 · Produção | Negar | `target.in_scope`, `level.exceeds_target` | "O teto desta entrada do escopo é N2; a validação pedida é N3. Nada é executado." |
| `192.0.2.1` · Gateway de borda | Negar | `target.excluded` | "Uma exclusão do escopo cobre o alvo. Exclusões sempre prevalecem." |
| `203.0.113.200` | Negar | `target.not_in_scope` | "Nenhuma inclusão do escopo cobre o alvo." |

**Exibição dos motivos:** chips em mono.

- Informativos com cores de `ok`.
- `approval.required` com cores de `mid`.
- Os de negação com cores de `crit` e ícone.

**Fluxo em cinco passos.** É uma timeline vertical; cada passo tem os estados atual, concluído e negado.

1. **Decisão de política.**
2. **Aprovação humana.**
   - Botões: "Aprovar como você (executor)" e "Aprovar como segundo operador".
   - Depois de aprovado: "Aprovação vinculada a este pedido exato (SHA-256 do pedido), válida por até 1 hora. Concessão de execução válida por até 10 minutos."
   - Fora do laboratório, acrescente: "Aprovação assinada (Ed25519) pela instalação do segundo operador."
3. **Execução segura.** O botão "Executar validação" leva a "Login com a conta de teste concluído. Marcador do evento: hesde-val-7f3a2c."
4. **Detecção.** O switch "Simular detecção ausente" começa desligado.
   - Com detecção: "Detectado: alerta correlacionado no SIEM pelo marcador em 42 s. EDR registrou o evento."
   - Sem detecção: "Não detectado em 5 minutos. Lacuna de detecção registrada como achado Alto, com recomendação de regra para o SIEM."
5. **Evidência:** "Evidência sha256:4d1f…a90c registrada e ancorada na trilha. Nenhum artefato restante no alvo."

Inclua também o botão "Recomeçar simulação" e toasts de sucesso e erro em cada passo.

#### Aba Escopo

**Esquerda: "Escopo aprovado · versão 3"**, com badge ok "Aprovado" e o texto "Autorização vigente até 31/12/2026".

| Tipo | Valor | Ambiente | Teto |
|---|---|---|---|
| Inclusão | 192.0.2.0/25 | Produção | N2 |
| Inclusão | 192.0.2.128/25 | Homologação | N3 |
| Inclusão | 198.51.100.0/24 | Produção | N2 |
| Inclusão | empresa.example e subdomínios | Produção | N2 |
| Inclusão | 203.0.113.0/26 | Laboratório | N3 |
| Exclusão | 192.0.2.1/32 | Gateway de borda | — |
| Exclusão | 198.51.100.128/25 | Rede industrial (OT) | — |

As exclusões aparecem com ícone de bloqueio e a nota "Exclusões sempre prevalecem."

**Direita: "Verificar alvo".** Um input em mono, com sugestões clicáveis em chips, e o botão "Verificar".

O mock `HesdeApi.checkScope(valor)` deve:

- fazer casamento real de IPv4 e CIDR;
- aplicar as exclusões antes das inclusões;
- tratar IPv4 mapeado em IPv6 como o mesmo endereço;
- recusar octetos com zero à esquerda;
- resolver nomes por uma tabela fixa de "DNS simulado".

O resultado mostra:

- o estado: Coberto, Coberto com exclusões, Excluído, Fora do escopo ou Inválido;
- a entrada que casou, o ambiente e o teto;
- os chips de motivo.

| Entrada | Resultado | Motivos |
|---|---|---|
| `192.0.2.10` | Coberto · Produção · N2 | `target.in_scope` |
| `192.0.2.1` | Excluído | `target.excluded` |
| `::ffff:192.0.2.1` | Excluído ("IPv4 mapeado em IPv6 é o mesmo endereço") | `target.excluded` |
| `192.0.02.10` | Inválido ("zeros à esquerda são recusados") | `target.invalid` |
| `192.0.2.0/24` | Coberto com exclusões | `target.in_scope`, `target.partially_excluded` |
| `198.51.100.200` | Excluído (rede industrial) | `target.excluded` |
| `203.0.113.200` | Fora do escopo | `target.not_in_scope` |
| `portal.empresa.example` | Coberto (resolve para 192.0.2.80) | `target.in_scope` |
| `intranet.empresa.example` | Excluído (resolve para 198.51.100.150) | `dns.resolved_excluded` |

- Qualquer outro IPv4 válido e não coberto → `target.not_in_scope`.
- Texto que não seja IP, CIDR nem nome válido → `target.invalid`.

Nota: "Cada conexão de rede é conferida contra o escopo antes de sair, inclusive depois da resolução de nomes."

#### Aba Trilha de auditoria

**Tabela de 8 eventos.** Colunas:

- seq e horário;
- ator: operador, sistema ou agendador;
- ação, em mono;
- resultado: `success`, `allow` ou `deny`;
- `prev_hash` e `hash`, abreviados (`sha256:9c1e…4b07`).

**Ações, na ordem:**

1. `engagement.create`
2. `scope.approve`
3. `authorization.create`
4. `session.start`
5. `policy.decision` (allow)
6. `policy.decision` (deny · target.excluded)
7. `finding.transition`
8. `session.finish`

**Âncora:** um card com "Âncora assinada · seq 8 · Ed25519 · chave `ed25519:3f2a…91bc`".

**Botão "Verificar integridade":** percorre os eventos em sequência, com check verde por linha (120 ms cada), e termina com "Trilha íntegra: 8 eventos encadeados, âncora válida."

**Segmentado "Simular":**

- **Nenhuma alteração.**
- **"Editar o evento 5":** a verificação para no evento 5, com "O hash do evento 5 não confere: alteração detectada a partir deste ponto."
- **"Reescrever a trilha com hashes recalculados":** a corrente passa, mas a âncora falha, com "A corrente foi recalculada, mas não bate com a âncora assinada: reescrita detectada."

Os estados de erro usam `--crit` e ícone.

**Botão "Exportar para verificação offline":** mostra o toast "Pacote de verificação gerado (simulação)."

#### Aba Relatórios

- **Segmentado** Executivo / Técnico, com descrição:
  - Executivo: "Para diretoria e comitês: postura, tendência, riscos principais e plano de ação, sem jargão.";
  - Técnico: "Para quem corrige: cada achado com evidência, regra, versão dos feeds e passo de correção."
- **Formatos** em chips: PDF, HTML, JSON, CSV, SARIF.
- **Botão "Gerar relatório":** skeleton de papel por 1,3 s, prévia e o toast "Relatório gerado: N páginas, manifesto assinado."
- **Prévia** em "papel": fundo `--surface` com sombra; cabeçalho com mini wordmark e "CONFIDENCIAL · TLP:AMBER+STRICT".
  - Executivo:
    - índice 68, 4 críticos, 87% conformes;
    - "Três decisões para este mês": exigir MFA nas contas privilegiadas do AD; atualizar o gateway de VPN exposto; bloquear o acesso público ao bucket de backups.
  - Técnico:
    - "Achado 1 de 14 · Contas privilegiadas sem MFA", com o ativo, a regra `windows.ad.privileged_mfa · v1.2.0`, a evidência em hash e a correção;
    - "Reprodutibilidade: regras 0.4.1 · feeds de 2026-10-11 · configuração sha256:58c6…2bab".
- **Nota:** "Cada relatório sai com manifesto assinado: dá para provar que não foi alterado depois de gerado."

#### Aba Integrações

Lista de cartões, cada um com ícone, título e descrição:

| Integração | Descrição |
|---|---|
| SIEM | "Eventos de auditoria e achados via syslog (CEF) ou HTTPS. Consultas de detecção para o Validate." |
| SOAR | "Webhooks assinados com HMAC para disparar playbooks de resposta." |
| Ticketing | "Jira, GitHub Issues e GitLab Issues, com responsável e prazo por severidade." |
| GRC e gestão de vulnerabilidades | "Exportação para DefectDojo e mapeamento para ISO/IEC 27001, CIS Controls e LGPD." |
| Formatos abertos | "SARIF, OCSF, CycloneDX e CSV com neutralização de fórmulas." (badge ok "Incluído", sem botão) |

**Botão "Conectar":**

- mostra carregamento e, no sucesso, vira "✓ Conectado" (borda `--ok-line`);
- o SOAR falha de propósito: "Informe o segredo HMAC do webhook antes de ativar.", com estado de erro e o botão "Tentar de novo";
- clicar de novo desconecta.

**Nota:** "Destinos só em lista de permissão, TLS verificado e credenciais em cofre. Simulação: nenhuma conexão real é feita."

### 6.7 Antes e depois (fundo `--bg`)

- **Textos:**
  - eyebrow: "Antes e depois";
  - H2: "Do ruído ao plano de ação.";
  - lead: "Arraste o controle para comparar o dia a dia sem e com o Hesde."
- **Segmentado:** Alertas · Relatórios · Visibilidade.
- **Palco da comparação:**
  - slider em input range acessível, com alça visível e `clip-path` controlado por `--pos`;
  - legendas "Sem Hesde" e "Com Hesde";
  - ao entrar na tela, a alça faz um aceno (50 → 38 → 62 → 50), exceto com movimento reduzido.

| Tema | Sem Hesde | Com Hesde |
|---|---|---|
| Alertas | Nuvem de 12 alertas, todos marcados "ALTA" em `--high`, em tons apagados. Texto: "Sem contexto do ativo, tudo pesa igual e o time decide no escuro." | "Três decisões para hoje": MFA nas contas privilegiadas do AD (Crítico · 7 dias); atualizar o gateway de VPN exposto (Crítico · 7 dias); restringir o banco à rede de aplicação (Alto · 30 dias). Texto: "O resto continua visível, em ordem de risco, com prazo." |
| Relatórios | Linhas de texto genéricas (skeleton estático). Texto: "A diretoria não lê, e o time técnico não sabe por onde começar." | "Plano de ação claro": três itens com equipe responsável e data. Texto: "Uma página para o comitê e o detalhe técnico para quem corrige, da mesma base." |
| Visibilidade | 12 barras mensais, só uma preenchida ("Uma fotografia por ano"). Texto: "Entre uma auditoria e outra, o risco muda e ninguém vê." | 12 barras em `--primary`, com tendência de queda ("Visibilidade contínua"). Texto: "Índice de exposição atualizado a cada sessão, com tendência e comparação entre períodos." |

### 6.8 Recursos (fundo `--bg-alt`)

- **Textos:** eyebrow "Recursos"; H2 "O essencial para reduzir exposição com método."
- **Grid de 3 × 2 cards:** hover elevado, ícone que redesenha e botão "Detalhes" que expande (`aria-expanded`, animação de altura).

| Card | Resumo | Detalhe |
|---|---|---|
| Inventário e descoberta de ativos | Hosts, serviços, contas, nuvem e código num inventário só, com histórico do que apareceu e sumiu. | A correlação de identidade usa identificadores fortes, como número de série e ID de instância. Um IP repetido sozinho não funde dois ativos. |
| Priorização contextual de riscos | Severidade, exposição, criticidade do ativo, EPSS e KEV combinados numa fila explicável. | Nunca só pelo CVSS. Cada classificação mostra os fatores que a produziram, e os prazos seguem a severidade: 7, 30, 90 e 180 dias, ajustáveis. |
| Análise de hardening | Linux, Windows, Active Directory, nuvem, containers e Kubernetes avaliados contra regras versionadas. | Fato e julgamento ficam separados: a observação bruta é guardada, e regras novas podem ser reaplicadas sobre dados antigos sem tocar no ambiente de novo. |
| Detecção de segredos e vulnerabilidades | Chaves, tokens e senhas expostos são encontrados e mascarados antes de qualquer gravação. | Guardamos só o tipo, uma prévia mascarada e uma impressão digital com chave da instalação. O Hesde não testa se a credencial funciona: a recomendação é sempre rotacionar. |
| Relatórios técnicos e executivos | A mesma base gera a visão do analista e a do comitê, com classificação de confidencialidade. | PDF, HTML, JSON, CSV e SARIF. Cada relatório leva as versões de regras e feeds, para ser reproduzível, e um manifesto assinado. |
| Integração com SIEM, SOAR, ticketing e GRC | Os achados chegam onde o time já trabalha, com responsável e prazo. | Webhooks assinados, destinos em lista de permissão e minimização de dados: só sai do Hesde o necessário para cada integração. |

Termos com tooltip de glossário: CTEM, EPSS, KEV, MITRE ATT&CK, SIEM, SOAR, GRC.

### 6.9 Como funciona (fundo `--bg`)

- **Textos:** eyebrow "Como funciona"; H2 "Quatro passos do primeiro acesso ao acompanhamento contínuo."
- **Layout:**
  - quatro colunas ligadas por uma linha horizontal que se preenche em `--primary` conforme o scroll (vertical no mobile);
  - numerais "01–04" em Bodoni (`--t-numeral`, cor `--primary`);
  - cada passo ganha destaque ao entrar na tela.

| Passo | Texto |
|---|---|
| 01 Conecte o ambiente | Defina o escopo, registre a autorização e escolha o modo: portátil, remoto ou nuvem, sempre com contas de menor privilégio. |
| 02 Execute a auditoria | Coleta somente leitura, dentro da janela combinada, com cada atividade decidida pelo motor de política e registrada. |
| 03 Priorize os riscos | Achados ordenados por risco real ao negócio, com fatores visíveis, responsável e prazo. |
| 04 Corrija, valide e acompanhe | Confirme correções com nova verificação, valide detecções com segurança e acompanhe a evolução entre sessões. |

### 6.10 Segurança e confiança (faixa burgundy)

- **Cores:**
  - fundo `--band-security-bg`;
  - texto `--band-security-ink`, secundário `--band-security-muted`;
  - linhas `--band-security-line`;
  - destaques e progresso em HESDE Light.
- **Layout:** duas colunas.
- **Esquerda:**
  - eyebrow "Segurança e confiança", em HESDE Light;
  - H2: "Construído com segurança desde o núcleo.";
  - lead: "Uma ferramenta que olha para as fraquezas de uma empresa precisa ser mais rigorosa que o ambiente que audita. Os controles abaixo valem em todos os planos e não são vendidos à parte.";
  - citação em Bodoni 28 px, com fio vertical em HESDE Light: "Nenhuma exploração destrutiva, nunca. Não existe nível de atividade destrutivo no Hesde."
- **Direita:** timeline com 8 controles.
  - Linha em `--band-security-line`, progresso em HESDE Light conforme o scroll.
  - O item atual ganha opacidade total e ponto preenchido; os anteriores ficam marcados.

| Controle | Texto |
|---|---|
| Núcleo em Rust | Segurança de memória por padrão e código inseguro proibido no projeto. |
| Menor privilégio | Contas somente leitura e comandos de uma lista fechada. O que exige mais permissão aparece como "não coberto". |
| Controle de escopo | Escopo versionado e aprovado. Exclusões prevalecem, e cada conexão de rede é conferida antes de sair. |
| Logs de auditoria | Trilha encadeada por hash, com âncoras assinadas e verificação offline. Nenhuma alteração entra sem o seu evento. |
| Mascaramento de segredos | Segredos encontrados são redigidos antes de gravar. Dados cifrados por cliente, com destruição criptográfica ao encerrar. |
| Validação humana para ações ativas | Toda validação exige aprovação por execução. Fora do laboratório, quem aprova não executa. |
| Nenhuma exploração destrutiva por padrão | O catálogo de ações é fechado e revisado. Nada de negação de serviço, alteração de dados ou movimentação lateral. |
| Pronto para ambientes corporativos | Funciona isolado, sem telemetria, com SBOM de cada versão e releases assinadas. |

### 6.11 Público-alvo (fundo `--bg`)

- **Textos:** eyebrow "Para quem"; H2 "Uma base comum para quem cuida do risco."
- **Grid de 3 × 2 cards:**

| Público | Texto |
|---|---|
| Times de segurança e SOC | Menos triagem manual e detecções comprovadas com eventos controlados. |
| Auditoria interna e GRC | Evidência verificável, trilha íntegra e mapeamento para normas. |
| Infraestrutura e operações | Correções claras, priorizadas e sem alterações automáticas nos sistemas. |
| Technology Risk | Risco tecnológico medido de forma consistente e comparável ao longo do tempo. |
| Desenvolvimento e AppSec | Segredos e dependências vulneráveis no repositório, com saída em SARIF. |
| Gestores de TI e C-level | Postura de segurança em linguagem de negócio e decisões com prazo. |

### 6.12 Prova social (fundo `--bg-alt`)

- **Textos:** eyebrow "Confiança"; H2 "Resultados que a sua equipe consegue demonstrar."
- **Quatro métricas qualitativas** em linha, sem números: ícone `--primary`, texto Geist 500 18 px, separadores verticais `--line`.
  - "Menos ruído operacional."
  - "Priorização baseada em risco."
  - "Evidências prontas para auditoria."
  - "Visibilidade contínua da postura de segurança."
- **Marquee de logos `[ESPAÇO RESERVADO]`:**
  - slots de 160 × 56 com borda tracejada `--line-strong` e texto `--muted` ("Logo de cliente", "Logo de parceiro");
  - laço contínuo e lento (40 s), com máscara de fade nas laterais;
  - pausa no hover e no foco;
  - com movimento reduzido, vira grade estática;
  - cópias duplicadas com `aria-hidden`.
- **Carrossel de depoimentos `[ESPAÇO RESERVADO]`:** 3 slides placeholder.
  - Texto entre colchetes, ex.: "[Depoimento de cliente: como a priorização mudou a rotina do time]".
  - Avatar tracejado, "[Nome]" e "[Cargo] · [Empresa]".
  - Citação em Bodoni 28 px.
  - Navegação: setas, dots (`aria-current`), swipe (pointer events) e setas do teclado. Sem autoplay.
  - Região live anuncia "Depoimento N de 3". Slides inativos com `aria-hidden` e `inert`.
- **Comentários no HTML:** "Substituir só com autorização por escrito e de uso de marca."

### 6.13 Preços (fundo `--bg`)

- **Textos:**
  - eyebrow: "Preços";
  - H2: "Planos para cada estágio de maturidade.";
  - lead: "Os controles de segurança estão em todos os planos. O que muda é a profundidade da análise, a escala e o suporte."
- **Segmentado Mensal / Anual:** troca o texto de cobrança dos planos pagos com fade de 160 ms, entre "Cobrança mensal" e "Cobrança anual · condições sob consulta". Nenhum valor numérico.
- **Três cards:** hover elevado e botões de largura total.
  - O recomendado tem borda de 1,5 px `--primary`, flag "Recomendado" (fundo `--primary`, texto `--primary-ink`) e `--shadow-2` permanente.

**Community** — "Para estudo, laboratório e pequenas equipes."

- Preço "Gratuito"; cobrança "Download gratuito".
- Itens:
  - descoberta de portas TCP e identificação de serviços;
  - para que serve cada serviço, em português;
  - alerta básico de exposição;
  - linha de comando, com saída em tabela, JSON e HTML;
  - até 10 varreduras por mês;
  - escopo, autorização, trilha de auditoria e cifragem completos.
- Botão secundário "Baixar gratuitamente": abre o modal "Download em preparação", com o botão "Avisar quando lançar", que leva ao formulário com o interesse "Community".

**Business** (Recomendado) — "Para empresas que precisam de escala, integrações e suporte."

- Preço "Sob consulta".
- Itens:
  - tudo do Community, sem limite de varreduras;
  - Hesde Audit completo;
  - vulnerabilidades com EPSS e KEV e priorização contextual;
  - aplicativo desktop;
  - relatórios executivos e técnicos em PDF, SARIF e CSV;
  - histórico e comparação entre sessões;
  - integrações com SIEM, ticketing e DefectDojo;
  - suporte em horário comercial.
- Botão primário "Solicitar demonstração".

**Enterprise** — "Para operações corporativas com requisitos avançados."

- Preço "Sob consulta".
- Itens:
  - tudo do Business;
  - Hesde Validate e Purple Team, com aprovação por segundo operador;
  - servidor central multiusuário, com SSO e RBAC;
  - mapeamento de conformidade (ISO/IEC 27001, CIS Controls, LGPD);
  - integrações avançadas com SOAR e GRC;
  - suporte dedicado e revisão de código sob NDA.
- Botão secundário "Fale com vendas".

**Tabela comparativa expansível** ("Comparar todos os recursos"):

- cabeçalho fixo com os 3 planos;
- ✓ em `--ok`, com o texto oculto "Incluído";
- — em `--muted`, com o texto oculto "Não incluído";
- rolagem horizontal no mobile.

| Recurso | Community | Business | Enterprise |
|---|---|---|---|
| Escopo, autorização e trilha de auditoria | ✓ | ✓ | ✓ |
| Cifragem por cliente e mascaramento de segredos | ✓ | ✓ | ✓ |
| Descoberta de portas e serviços | ✓ | ✓ | ✓ |
| Limite de varreduras | 10 por mês | Sem limite | Sem limite |
| Auditoria de hardening e configurações | — | ✓ | ✓ |
| Vulnerabilidades com EPSS e KEV | — | ✓ | ✓ |
| Aplicativo desktop | — | ✓ | ✓ |
| Relatórios executivos em PDF | — | ✓ | ✓ |
| Integrações com SIEM e ticketing | — | ✓ | ✓ |
| Validate e Purple Team | — | — | ✓ |
| Servidor central, SSO e RBAC | — | — | ✓ |
| Suporte dedicado | — | — | ✓ |

### 6.14 FAQ (fundo `--bg-alt`)

- **Layout:** duas colunas no desktop.
  - Esquerda, fixa ao rolar: eyebrow "Perguntas frequentes" e H2 "O que as equipes perguntam antes de começar."
  - Direita: o acordeão.
- **Acordeão:** botões dentro de `h3`, com `aria-expanded` e `aria-controls`; painéis com `role="region"`. Vários podem ficar abertos ao mesmo tempo.

| Pergunta | Resposta |
|---|---|
| O Hesde explora vulnerabilidades? | Não. O Audit é somente leitura por padrão. O Validate confirma riscos com ações seguras de um catálogo fechado, como login com conta de teste ou evento benigno detectável. Não há exploração destrutiva, negação de serviço nem alteração de dados. |
| O Hesde altera configurações dos sistemas? | Não. O Hesde recomenda a correção e acompanha se ela foi feita. Os únicos arquivos que ele remove são os temporários que ele mesmo criou e registrou. |
| Como funciona a autorização para validações? | O cliente aprova uma versão do escopo e uma autorização formal, com vigência, janelas de teste, ambientes e nível máximo. Cada validação passa pelo motor de política e exige aprovação humana por execução. Fora do laboratório, quem aprova não pode executar. |
| Quais ambientes são suportados? | Linux, Windows e Active Directory, nuvem com acesso somente leitura, containers, Kubernetes, aplicações web e repositórios de código. A coleta pode ser portátil no próprio host, remota com credencial, remota sem credencial ou a partir de uma imagem offline. |
| O Hesde integra com SIEM e SOAR? | Sim. Envia eventos e achados para o SIEM, dispara playbooks no SOAR por webhooks assinados e consulta o SIEM e o EDR para confirmar se uma validação foi detectada. |
| Como são tratados segredos e dados sensíveis? | Segredos encontrados são mascarados antes de qualquer gravação, e material de credencial do alvo nunca é extraído. Os dados de cada cliente ficam cifrados com chave própria, guardada no cofre do sistema operacional, e podem ser destruídos de forma irrecuperável ao fim do contrato, apoiando o atendimento à LGPD. |

### 6.15 Contato e demonstração (fundo `--bg`)

**Coluna esquerda:**

- eyebrow: "Contato";
- H2: "Solicite uma demonstração.";
- lead: "Mostramos o Hesde em um laboratório com dados fictícios e conversamos sobre o seu escopo, seus controles e suas prioridades.";
- checklist: "Retornamos pelo e-mail informado" · "Demonstração guiada, sem acesso ao seu ambiente" · "Proposta alinhada ao escopo e ao nível de atividade".

**Coluna direita:** um card com o formulário (`novalidate` e validação própria).

**Campos:**

- Nome completo: mínimo de 3 caracteres.
- E-mail corporativo:
  - formato válido;
  - recusa domínios pessoais (gmail.com, hotmail.com, outlook.com, live.com, yahoo.com, yahoo.com.br, bol.com.br, uol.com.br, icloud.com, terra.com.br) com a mensagem "Use o e-mail da empresa, não um e-mail pessoal.".
- Empresa.
- Área: select com os 6 públicos.
- Tamanho do ambiente: até 100 ativos, de 100 a 1.000, de 1.000 a 10.000, mais de 10.000.
- Interesse principal, em radio-chips: Community, Audit, Validate, Audit + Validate, Falar com a equipe.
- "Conte o seu contexto (opcional)": até 600 caracteres, com contador.
- Consentimento obrigatório, com link `[a definir]` para a Política de Privacidade.

**Validação:** em tempo real depois do primeiro blur, com mensagens com ícone, `aria-invalid` e `aria-describedby`.

**Envio:**

- Com erros: foco no primeiro campo inválido e toast de erro.
- Sem erros: o botão fica em carregamento ("Enviando…") por 1,1 s, chamando `HesdeApi.submitContact`.
- Sucesso: o formulário dá lugar a um painel com check animado, "Solicitação recebida.", "Protocolo DEMO-00000. Retornamos pelo e-mail informado." e o botão "Enviar outra solicitação". O foco vai para o painel.
- Erro: o alerta "Não foi possível enviar agora. Seus dados continuam no formulário." e um toast. É acionado pelo switch "Simular falha no envio", na página do sistema de design.

**Nota no formulário:** "Protótipo: nenhum dado sai deste navegador."

**Atalhos para o formulário:**

- todo botão "Solicitar demonstração" rola até aqui e foca o nome (`preventScroll`);
- "Falar com a equipe" marca o interesse correspondente;
- "Avisar quando lançar" marca "Community".

### 6.16 CTA final (faixa Signature Red)

- **Fundo:** `--band-cta-bg` (`#CC383E`). É o único uso de Signature Red na interface.
- **Título:** "Transforme exposições em decisões de segurança.", em Bodoni, mínimo de 40 px, cor Ivory `#F3EFE8` (contraste de 4,36:1, válido para texto grande). Nenhum texto menor que 24 px sobre o vermelho.
- **Botões (lg):**
  - "Solicitar demonstração": fundo `#340C0E`, texto `#F8C6C8`;
  - "Falar com a equipe": fundo `#F3EFE8`, texto `#340C0E`.
- **Decoração:** réguas finas com ticks em `rgba(243,239,232,.25)` nas bordas superior e inferior.

### 6.17 Rodapé (Charcoal)

**Cores:** fundo `--footer-bg`, texto `--footer-ink`, secundário `--footer-muted`; links com hover em HESDE Light.

**Coluna 1:**

- wordmark HESDE em Ivory;
- frase: "Gestão contínua de exposições, auditoria e validação segura de riscos.";
- redes sociais (LinkedIn, GitHub, YouTube) como botões de ícone, com `aria-label` "(link a definir)" e o toast "Link a definir na versão final do site.".

**Links:** Produto, Documentação (abre o modal), Segurança, Privacidade `[a definir]`, Termos `[a definir]`, Contato, Sistema de design.

**Linha legal** (borda superior `rgba(243,239,232,.12)`):

- "Hesde — Plataforma de segurança e gestão de exposições."
- "Protótipo navegável. Telas e dados ilustrativos."

### 6.18 Comportamentos globais

**Modal "Documentação em preparação":**

- texto: "A documentação pública vai reunir guias de instalação, modelo de dados, motor de política, formato das evidências e referência das integrações.";
- checklist:
  - primeiros passos e modos de execução;
  - escopo, autorização e níveis de atividade;
  - trilha de auditoria e verificação offline;
  - esquemas JSON e formatos de exportação;
- botões "Fechar" e "Pedir acesso antecipado" (vai ao formulário).

**Revelação no scroll:**

- fade e `translateY(16px)` em 360 ms, com 70 ms entre irmãos (no máximo 5);
- só nos elementos abaixo da dobra no carregamento;
- desligada com movimento reduzido.

**Link "Pular para o conteúdo":** visível no foco.

---

## 7. Página "Sistema de design" (`#design-system`)

- **Posição e acesso:** no fim da página, com link só no rodapé.
- **Cabeçalho:** fundo `--bg`, eyebrow "Sistema de design · interno" e H2 "Fundamentos e componentes.".
- **Organização:** cada bloco abaixo fica num card.

1. **Marca:**
   - o wordmark em três aplicações: burgundy sobre Ivory, Ivory sobre Charcoal e burgundy sobre Signature Red;
   - as 5 cores com nome e hex;
   - barra de proporção (70% neutros, 20% burgundy, 5% rosa, 5% vermelho);
   - regras do logotipo: área de proteção ilustrada com medidas, "não esticar", "não aplicar sombra".
2. **Cores da interface:** neutros, primária e faixas em pares claro/escuro, com o contraste medido ao lado de cada par de texto.
3. **Estados de risco:** os 6 badges, com ícone, e as cores de gráfico.
4. **Tipografia:** amostra de cada token da escala, com tamanho e uso.
5. **Espaçamento e grade:** régua de 4 a 128 e o switch "Mostrar grade", que sobrepõe as 12 colunas à página inteira.
6. **Raios, sombras e movimento:** amostras e um botão que reproduz as durações.
7. **Botões:** todas as variantes e estados (padrão, hover forçado, foco, carregando, desativado).
8. **Campos:** padrão, foco, erro, válido, desativado, além de select, textarea, switch, checkbox e radio-chips.
9. **Badges, chips e tags.**
10. **Tabela** de exemplo com linha selecionada.
11. **Abas e segmentado.**
12. **Modal, toasts e tooltip**, com botões para disparar toasts de informação, sucesso e erro.
13. **Estados:** carregando (skeleton), vazio, erro, sucesso e o switch "Simular falha no envio do formulário de contato".
14. **Gráficos:** barra empilhada, sparkline, barras e medidor.
15. **Timeline.**
16. **Ícones:** grade com todos os símbolos do sprite e o nome de cada um (traço 1,6, cantos arredondados, grade de 24 px).
17. **Espaços da marca:** slots `[ESPAÇO DA MARCA]` para o SVG do logotipo, o símbolo do favicon e do app, e a fotografia e direção de arte.

---

## 8. Dados fictícios (`data.js`)

### Ativos

| ID | Nome | Endereço | Tipo | Ambiente | Exposição | Criticidade | Responsável | Achados |
|---|---|---|---|---|---|---|---|---|
| a-vpn | vpn-borda-01.empresa.example | 192.0.2.10 | Gateway VPN | Produção | Internet | 5 | Infraestrutura de rede | Crítico: versão da VPN fora do suporte do fabricante (fatores: Exposto à internet, Ativo crítico, Exploração ativa conhecida (KEV)) · Médio: TLS 1.0 aceito no portal de acesso |
| a-dc | dc-01.empresa.example | 198.51.100.5 | Active Directory | Produção | Interno | 5 | Identidade e acesso | Crítico: contas privilegiadas sem MFA · Alto: assinatura SMB não obrigatória |
| a-bucket | bucket-backups-hml | Armazenamento em nuvem | Armazenamento em nuvem | Homologação | Internet | 4 | Plataforma de nuvem | Crítico: listagem pública no bucket de backups |
| a-repo | repo-pagamentos | Repositório de código | Repositório | Desenvolvimento | Interno | 4 | Engenharia de pagamentos | Crítico: chave de acesso de nuvem exposta no histórico (fator "Segredo mascarado: ••••••••••••"; ação "Revogar e rotacionar. O Hesde nunca testa se a chave funciona.") |
| a-erp | srv-erp-01.empresa.example | 198.51.100.21 | Linux · ERP | Produção | Interno | 5 | Sistemas corporativos | Alto: SSH permite login direto do root · Alto: atualizações de segurança pendentes há mais de 60 dias |
| a-k8s | k8s-prod | Cluster Kubernetes | Kubernetes | Produção | Interno | 4 | Plataforma | Alto: pods executando como root sem necessidade · Médio: logs de auditoria da API desativados |
| a-db | db-clientes-01.empresa.example | 198.51.100.40 | Banco de dados | Produção | Interno | 5 | Dados | Alto: porta do banco acessível a partir da rede de usuários (fator "Dados pessoais (LGPD)") |
| a-portal | portal.empresa.example | 192.0.2.80 | Aplicação web | Produção | Internet | 4 | Canais digitais | Médio: certificado TLS expira em 12 dias · Baixo: cabeçalhos de segurança HTTP ausentes |
| a-hml | app-hml-02.empresa.example | 192.0.2.140 | Aplicação web | Homologação | Interno | 3 | Canais digitais | Baixo: HSTS ausente |
| a-ws | ws-financeiro-023 | 198.51.100.123 | Windows 11 | Produção | Interno | 3 | Suporte | Médio: criptografia de disco desativada |
| a-print | print-srv-02.empresa.example | 198.51.100.60 | Windows Server | Produção | Interno | 2 | Suporte | Médio: serviço habilitado sem uso |
| a-mon | srv-monitoramento.empresa.example | 198.51.100.70 | Linux | Produção | Interno | 2 | Operações | Baixo: sincronização de horário não configurada |
| a-lab | lab-validate-01 | 203.0.113.20 | Laboratório isolado | Laboratório | Interno | 1 | Segurança ofensiva autorizada | Nenhum (Conforme) |

### Funções da `HesdeApi`

Todas são assíncronas, com latência configurável:

- `listAssets({query, severities, environment, onlyInternet})`
- `getAsset(id)`
- `summary()`
- `evaluatePolicy(targetId)`
- `approve(targetId, {self})`
- `runValidation(targetId, {detected})`
- `checkScope(value)`
- `listAuditEvents()`
- `verifyAuditTrail({tamper: "none" | "edit" | "rewrite"})`
- `generateReport(kind)`
- `connectIntegration(id)`
- `submitContact(payload)`
- `settings.{latency, failSubmit}`

Documente com JSDoc o formato de entrada e de saída de cada uma.

---

## 9. Requisitos técnicos

### 9.1 `index.html`

Documento completo, com:

- `<!doctype html>`, `<html lang="pt-BR">`, `<meta charset="utf-8">` e viewport;
- `<title>`: "Hesde — Gestão contínua de exposições e riscos de segurança";
- meta description;
- `<meta name="color-scheme" content="light dark">`;
- `theme-color` com `media`: `#F3EFE8` no tema claro e `#191718` no escuro;
- Open Graph (`og:title`, `og:description`, `og:type` website, `og:locale` pt_BR) e `twitter:card` summary;
- favicon SVG inline;
- `<link rel="canonical">` com URL `[a definir]`.

### 9.2 Semântica

- `header`, `nav`, `main`, `section` com `aria-labelledby`, e `footer`;
- um único `h1`, um `h2` por seção e `h3` nos cards.

### 9.3 JavaScript

- IIFE com `"use strict"`;
- um `init*` por módulo, cada um inicializado dentro de try/catch;
- sem `alert()` e sem `eval`;
- sem `innerHTML` com dado não escapado: use uma função `escapeHtml`;
- `localStorage` só para o tema (`hesde-theme`), sempre em try/catch.

### 9.4 Restrições

- Nenhuma requisição externa além das fontes. Sem analytics, sem cookies, sem iframes.
- Deve funcionar aberto direto do disco (`file://`) e servido por HTTP.

### 9.5 Testes

- **Navegadores:** Chrome, Firefox e Safari recentes.
- **Larguras:** 1440, 1280, 1024, 768, 390 e 375 px.

---

## 10. Critérios de aceite

- [ ] Identidade HESDE aplicada em todo o site, nos dois temas.
- [ ] Signature Red só no CTA final e no sistema de design; rótulos de seção em burgundy (tema claro) ou HESDE Light (tema escuro).
- [ ] Todos os pares texto/fundo com contraste AA medido, inclusive no tema escuro e na faixa burgundy.
- [ ] Toda severidade com cor, ícone e rótulo.
- [ ] Domínios só `empresa.example` e IPs só das faixas RFC 5737.
- [ ] Validate:
  - [ ] laboratório aceita autoaprovação e mostra a dispensa;
  - [ ] homologação recusa a autoaprovação com `approval.self_approval`;
  - [ ] produção nega com `level.exceeds_target`;
  - [ ] os dois alvos fora do escopo negam com o código certo.
- [ ] Abas Escopo e Trilha funcionando em todos os casos das tabelas.
- [ ] Preços conforme a seção 6.13, sem valores e sem promessa de prazo de resposta.
- [ ] Teclado: todas as interações alcançáveis e operáveis, com foco visível; o modal prende e devolve o foco.
- [ ] Com `prefers-reduced-motion`: nenhum laço, nenhum deslocamento, estados finais visíveis.
- [ ] Sem rolagem horizontal a 375 px, sem erros no console e sem layout shift visível.
- [ ] Tema claro como padrão; o escuro segue o sistema; o alternador tem prioridade sobre o sistema; sem flash na carga.
- [ ] Placeholders `[ESPAÇO RESERVADO]` e `[ESPAÇO DA MARCA]` presentes e comentados.

---

## 11. Fora do escopo

- Backend real e envio de formulário.
- Logos, depoimentos e textos legais reais.
- Valores dos planos.
- Rotas separadas: o site é uma página única com âncoras, mais `#design-system`.

Ao terminar, liste os arquivos criados e o que ficou pendente.
