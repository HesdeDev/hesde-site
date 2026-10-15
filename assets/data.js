/*
 * Hesde · dados fictícios e API simulada (HesdeApi).
 *
 * HesdeApi é a única camada de dados da interface. Para integrar um backend, troque o corpo
 * de cada função por uma chamada HTTP, mantendo os formatos de entrada e saída documentados.
 *
 * Tudo aqui é ilustrativo. Endereços só das faixas de documentação (RFC 5737), domínios só
 * de empresa.example, organização "Empresa Exemplo S.A.". Nenhuma credencial aparece, nem falsa.
 */
(function (global) {
  "use strict";

  /** @typedef {"crit"|"high"|"mid"|"low"|"ok"} Severity */
  /** @typedef {"prod"|"hml"|"dev"|"lab"} Environment */

  const SEV_WEIGHT = { crit: 4, high: 3, mid: 2, low: 1, ok: 0 };
  const DEADLINE_DAYS = { crit: 7, high: 30, mid: 90, low: 180 };
  const ENV_LABEL = { prod: "Produção", hml: "Homologação", dev: "Desenvolvimento", lab: "Laboratório" };
  const MASK = "••••••••••••";

  /**
   * @typedef {Object} Finding
   * @property {string} id
   * @property {Severity} sev
   * @property {string} title
   * @property {string} rule      Regra versionada que produziu o achado
   * @property {string[]} factors Fatores de risco visíveis
   * @property {string} action    Ação recomendada
   */
  /**
   * @typedef {Object} Asset
   * @property {string} id
   * @property {string} name
   * @property {string} address   IPv4 (RFC 5737) ou descrição quando o ativo não tem endereço
   * @property {boolean} isIp
   * @property {string} type
   * @property {Environment} env
   * @property {"internet"|"internal"} exposure
   * @property {1|2|3|4|5} criticality
   * @property {string} owner
   * @property {string} lastSeen  ISO 8601, UTC
   * @property {Finding[]} findings
   */

  const f = (id, sev, title, rule, factors, action) => ({ id, sev, title, rule, factors, action });

  /** @type {Asset[]} */
  const ASSETS = [
    { id: "a-vpn", name: "vpn-borda-01.empresa.example", address: "192.0.2.10", isIp: true, type: "Gateway VPN", env: "prod", exposure: "internet", criticality: 5, owner: "Infraestrutura de rede", lastSeen: "2026-10-14T09:41:00Z", findings: [
      f("f-vpn-1", "crit", "Versão da VPN fora do suporte do fabricante", "network.vpn.vendor_support", ["Exposto à internet", "Ativo crítico", "Exploração ativa conhecida (KEV)"], "Atualizar para uma versão suportada e restringir a interface de administração."),
      f("f-vpn-2", "mid", "TLS 1.0 aceito no portal de acesso", "network.tls.min_version", ["Exposto à internet"], "Desativar TLS 1.0 e 1.1 e manter TLS 1.2 ou superior."),
    ] },
    { id: "a-dc", name: "dc-01.empresa.example", address: "198.51.100.5", isIp: true, type: "Active Directory", env: "prod", exposure: "internal", criticality: 5, owner: "Identidade e acesso", lastSeen: "2026-10-14T09:38:00Z", findings: [
      f("f-dc-1", "crit", "Contas privilegiadas sem MFA", "windows.ad.privileged_mfa", ["Ativo crítico", "Identidade privilegiada"], "Exigir MFA para todas as contas dos grupos privilegiados."),
      f("f-dc-2", "high", "Assinatura SMB não obrigatória", "windows.smb.signing_required", ["Ativo crítico"], "Tornar a assinatura SMB obrigatória por política de grupo."),
    ] },
    { id: "a-bucket", name: "bucket-backups-hml", address: "Armazenamento em nuvem", isIp: false, type: "Armazenamento em nuvem", env: "hml", exposure: "internet", criticality: 4, owner: "Plataforma de nuvem", lastSeen: "2026-10-14T08:55:00Z", findings: [
      f("f-bk-1", "crit", "Listagem pública no bucket de backups", "cloud.storage.public_list", ["Exposto à internet", "Dados de backup"], "Bloquear o acesso público e revisar a política do bucket."),
    ] },
    { id: "a-repo", name: "repo-pagamentos", address: "Repositório de código", isIp: false, type: "Repositório", env: "dev", exposure: "internal", criticality: 4, owner: "Engenharia de pagamentos", lastSeen: "2026-10-14T07:12:00Z", findings: [
      f("f-rp-1", "crit", "Chave de acesso de nuvem exposta no histórico", "secrets.cloud_access_key", ["Segredo mascarado: " + MASK, "Tipo: chave de acesso de nuvem"], "Revogar e rotacionar. O Hesde nunca testa se a chave funciona."),
    ] },
    { id: "a-erp", name: "srv-erp-01.empresa.example", address: "198.51.100.21", isIp: true, type: "Linux · ERP", env: "prod", exposure: "internal", criticality: 5, owner: "Sistemas corporativos", lastSeen: "2026-10-14T09:40:00Z", findings: [
      f("f-erp-1", "high", "SSH permite login direto do root", "linux.ssh.permit_root_login", ["Ativo crítico"], "Definir PermitRootLogin como no e usar contas nominais com sudo."),
      f("f-erp-2", "high", "Atualizações de segurança pendentes há mais de 60 dias", "linux.updates.security", ["Ativo crítico"], "Aplicar as atualizações na próxima janela de manutenção."),
    ] },
    { id: "a-k8s", name: "k8s-prod", address: "Cluster Kubernetes", isIp: false, type: "Kubernetes", env: "prod", exposure: "internal", criticality: 4, owner: "Plataforma", lastSeen: "2026-10-14T09:20:00Z", findings: [
      f("f-k8s-1", "high", "Pods executando como root sem necessidade", "k8s.pod.run_as_non_root", ["Produção"], "Definir runAsNonRoot e revisar o securityContext das cargas."),
      f("f-k8s-2", "mid", "Logs de auditoria da API desativados", "k8s.apiserver.audit_log", ["Produção"], "Ativar a política de auditoria do servidor de API."),
    ] },
    { id: "a-db", name: "db-clientes-01.empresa.example", address: "198.51.100.40", isIp: true, type: "Banco de dados", env: "prod", exposure: "internal", criticality: 5, owner: "Dados", lastSeen: "2026-10-14T09:36:00Z", findings: [
      f("f-db-1", "high", "Porta do banco acessível a partir da rede de usuários", "network.segmentation.db_port", ["Ativo crítico", "Dados pessoais (LGPD)"], "Restringir o acesso à porta do banco à rede de aplicação."),
    ] },
    { id: "a-portal", name: "portal.empresa.example", address: "192.0.2.80", isIp: true, type: "Aplicação web", env: "prod", exposure: "internet", criticality: 4, owner: "Canais digitais", lastSeen: "2026-10-14T09:42:00Z", findings: [
      f("f-pt-1", "mid", "Certificado TLS expira em 12 dias", "web.tls.cert_expiry", ["Exposto à internet"], "Renovar o certificado e automatizar a renovação."),
      f("f-pt-2", "low", "Cabeçalhos de segurança HTTP ausentes", "web.http.security_headers", ["Exposto à internet"], "Adicionar Content-Security-Policy, X-Content-Type-Options e Referrer-Policy."),
    ] },
    { id: "a-hml", name: "app-hml-02.empresa.example", address: "192.0.2.140", isIp: true, type: "Aplicação web", env: "hml", exposure: "internal", criticality: 3, owner: "Canais digitais", lastSeen: "2026-10-14T09:30:00Z", findings: [
      f("f-hml-1", "low", "HSTS ausente", "web.http.hsts", [], "Ativar HSTS depois de confirmar HTTPS em todos os caminhos."),
    ] },
    { id: "a-ws", name: "ws-financeiro-023", address: "198.51.100.123", isIp: true, type: "Windows 11", env: "prod", exposure: "internal", criticality: 3, owner: "Suporte", lastSeen: "2026-10-14T08:02:00Z", findings: [
      f("f-ws-1", "mid", "Criptografia de disco desativada", "windows.disk.encryption", [], "Ativar a criptografia de disco com a chave de recuperação em custódia."),
    ] },
    { id: "a-print", name: "print-srv-02.empresa.example", address: "198.51.100.60", isIp: true, type: "Windows Server", env: "prod", exposure: "internal", criticality: 2, owner: "Suporte", lastSeen: "2026-10-14T08:10:00Z", findings: [
      f("f-pr-1", "mid", "Serviço habilitado sem uso", "windows.services.unused", [], "Desativar o serviço e registrar a mudança."),
    ] },
    { id: "a-mon", name: "srv-monitoramento.empresa.example", address: "198.51.100.70", isIp: true, type: "Linux", env: "prod", exposure: "internal", criticality: 2, owner: "Operações", lastSeen: "2026-10-14T09:05:00Z", findings: [
      f("f-mon-1", "low", "Sincronização de horário não configurada", "linux.time.sync", [], "Configurar a sincronização com as fontes de horário internas."),
    ] },
    { id: "a-lab", name: "lab-validate-01", address: "203.0.113.20", isIp: true, type: "Laboratório isolado", env: "lab", exposure: "internal", criticality: 1, owner: "Segurança ofensiva autorizada", lastSeen: "2026-10-14T09:00:00Z", findings: [] },
  ];

  /* ---------- utilidades ---------- */

  const settings = { latency: 420, failSubmit: false };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms == null ? settings.latency : ms));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fail = (code, message) => Object.assign(new Error(message), { code });

  /** Severidade máxima de um ativo; "ok" quando não há achados. */
  function riskOf(asset) {
    return asset.findings.reduce((m, x) => (SEV_WEIGHT[x.sev] > SEV_WEIGHT[m] ? x.sev : m), "ok");
  }
  function decorate(a) {
    const risk = riskOf(a);
    const out = clone(a);
    out.findings.sort((x, y) => SEV_WEIGHT[y.sev] - SEV_WEIGHT[x.sev]);
    return Object.assign(out, {
      risk,
      priority: SEV_WEIGHT[risk] * 10 + a.criticality,
      envLabel: ENV_LABEL[a.env],
      deadlineDays: DEADLINE_DAYS[risk] || null,
    });
  }

  /* ---------- escopo e casamento de alvos ---------- */

  const SCOPE = {
    version: 3,
    status: "approved",
    authorizationUntil: "2026-12-31",
    entries: [
      { id: "s1", kind: "include", value: "192.0.2.0/25", env: "Produção", ceiling: 2 },
      { id: "s2", kind: "include", value: "192.0.2.128/25", env: "Homologação", ceiling: 3 },
      { id: "s3", kind: "include", value: "198.51.100.0/24", env: "Produção", ceiling: 2 },
      { id: "s4", kind: "include", value: "empresa.example", label: "empresa.example e subdomínios", env: "Produção", ceiling: 2, domain: true },
      { id: "s5", kind: "include", value: "203.0.113.0/26", env: "Laboratório", ceiling: 3, lab: true },
      { id: "s6", kind: "exclude", value: "192.0.2.1/32", env: "Gateway de borda" },
      { id: "s7", kind: "exclude", value: "198.51.100.128/25", env: "Rede industrial (OT)" },
    ],
  };

  /** DNS simulado: tabela fixa, sem consulta real. */
  const DNS = {
    "empresa.example": "192.0.2.80",
    "www.empresa.example": "192.0.2.80",
    "portal.empresa.example": "192.0.2.80",
    "intranet.empresa.example": "198.51.100.150",
    "vpn-borda-01.empresa.example": "192.0.2.10",
    "dc-01.empresa.example": "198.51.100.5",
    "srv-erp-01.empresa.example": "198.51.100.21",
    "db-clientes-01.empresa.example": "198.51.100.40",
    "app-hml-02.empresa.example": "192.0.2.140",
    "print-srv-02.empresa.example": "198.51.100.60",
    "srv-monitoramento.empresa.example": "198.51.100.70",
  };

  /** IPv4 em notação decimal pontuada; octetos com zero à esquerda são recusados. */
  function parseIPv4(s) {
    const parts = s.split(".");
    if (parts.length !== 4) return { error: "format" };
    let n = 0;
    for (const p of parts) {
      if (!/^\d{1,3}$/.test(p)) return { error: "format" };
      if (p.length > 1 && p[0] === "0") return { error: "leading_zero" };
      const v = Number(p);
      if (v > 255) return { error: "range" };
      n = n * 256 + v;
    }
    return { start: n, end: n };
  }
  function parseCidr(s) {
    const [ip, pre] = s.split("/");
    if (!/^\d{1,2}$/.test(pre) || (pre.length > 1 && pre[0] === "0") || Number(pre) > 32) return { error: "prefix" };
    const base = parseIPv4(ip);
    if (base.error) return base;
    const size = Math.pow(2, 32 - Number(pre));
    if (base.start % size !== 0) return { error: "host_bits" };
    return { start: base.start, end: base.start + size - 1, prefix: Number(pre) };
  }
  const RANGES = SCOPE.entries.filter((e) => !e.domain).map((e) => Object.assign({}, e, parseCidr(e.value)));
  const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

  const INVALID_NOTE = {
    format: "Não é um IPv4, uma faixa CIDR nem um nome válido.",
    leading_zero: "Zeros à esquerda são recusados: a notação fica ambígua entre decimal e octal.",
    range: "Cada octeto vai de 0 a 255.",
    prefix: "O prefixo CIDR vai de 0 a 32, sem zeros à esquerda.",
    host_bits: "A faixa tem bits de host ligados. Use o endereço de rede da faixa.",
  };
  const STATE_LABEL = { covered: "Coberto", covered_partial: "Coberto com exclusões", excluded: "Excluído", out: "Fora do escopo", invalid: "Inválido" };

  function result(input, kind, state, extra) {
    return Object.assign({ input, kind, state, label: STATE_LABEL[state], entry: null, reasons: [], note: "" }, extra);
  }

  /** Avalia uma faixa [start, end]: exclusões primeiro, depois inclusões. */
  function evaluateRange(input, kind, range, note) {
    const excl = RANGES.filter((r) => r.kind === "exclude" && overlaps(r, range));
    const full = excl.find((r) => r.start <= range.start && r.end >= range.end);
    if (full) {
      return result(input, kind, "excluded", { entry: { value: full.value, env: full.env, ceiling: null }, reasons: ["target.excluded"], note: note || "Uma exclusão cobre o alvo. Exclusões sempre prevalecem." });
    }
    const incl = RANGES.filter((r) => r.kind === "include" && overlaps(r, range)).sort((a, b) => a.start - b.start);
    let cursor = range.start;
    for (const r of incl) if (r.start <= cursor && r.end >= cursor) cursor = r.end + 1;
    if (!incl.length || cursor <= range.end) {
      return result(input, kind, "out", { reasons: ["target.not_in_scope"], note: incl.length ? "Parte da faixa não tem inclusão no escopo." : "Nenhuma inclusão do escopo cobre o alvo." });
    }
    const entry = {
      value: incl.map((r) => r.value).join(" + "),
      env: Array.from(new Set(incl.map((r) => r.env))).join(" e "),
      ceiling: Math.min.apply(null, incl.map((r) => r.ceiling)),
      lab: incl.every((r) => r.lab),
    };
    if (excl.length) {
      return result(input, kind, "covered_partial", { entry, reasons: ["target.in_scope", "target.partially_excluded"], note: "A faixa contém " + excl.map((r) => r.value + " (" + r.env + ")").join(", ") + ", que continua bloqueada." });
    }
    return result(input, kind, "covered", { entry, reasons: ["target.in_scope"], note: note || "" });
  }

  const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

  /**
   * Confere um alvo contra o escopo aprovado.
   * @param {string} value IPv4, CIDR, IPv4 mapeado em IPv6 (::ffff:a.b.c.d) ou nome
   * @returns {{input:string, kind:string, state:"covered"|"covered_partial"|"excluded"|"out"|"invalid",
   *   label:string, entry:?{value:string, env:string, ceiling:?number, lab?:boolean}, reasons:string[],
   *   note:string, resolved?:string}}
   */
  function matchScope(value) {
    const input = String(value == null ? "" : value).trim();
    const v = input.toLowerCase().replace(/\.$/, "");
    if (!v) return result(input, "empty", "invalid", { reasons: ["target.invalid"], note: "Informe um endereço, uma faixa CIDR ou um nome." });

    if (v.startsWith("::ffff:")) {
      const ip = parseIPv4(v.slice(7));
      if (ip.error) return result(input, "ipv6", "invalid", { reasons: ["target.invalid"], note: INVALID_NOTE[ip.error] });
      return withMappedNote(evaluateRange(input, "ipv4-mapped", ip));
    }
    if (v.includes(":")) {
      if (/^[0-9a-f:]+$/.test(v) && v.split(":").length <= 8) {
        return result(input, "ipv6", "out", { reasons: ["target.not_in_scope"], note: "IPv6 nativo: nenhuma inclusão deste escopo cobre o endereço." });
      }
      return result(input, "unknown", "invalid", { reasons: ["target.invalid"], note: INVALID_NOTE.format });
    }
    if (/^[\d./]+$/.test(v)) {
      const parsed = v.includes("/") ? parseCidr(v) : parseIPv4(v);
      if (parsed.error) return result(input, "ip", "invalid", { reasons: ["target.invalid"], note: INVALID_NOTE[parsed.error] });
      return evaluateRange(input, v.includes("/") ? "cidr" : "ipv4", parsed);
    }
    if (!HOST_RE.test(v)) return result(input, "unknown", "invalid", { reasons: ["target.invalid"], note: INVALID_NOTE.format });

    const domainEntry = SCOPE.entries.find((e) => e.domain);
    if (v !== domainEntry.value && !v.endsWith("." + domainEntry.value)) {
      return result(input, "name", "out", { reasons: ["target.not_in_scope"], note: "Nenhuma inclusão do escopo cobre o nome." });
    }
    const entry = { value: domainEntry.label, env: domainEntry.env, ceiling: domainEntry.ceiling };
    const resolved = DNS[v];
    if (!resolved) {
      return result(input, "name", "covered", { entry, reasons: ["target.in_scope"], note: "Sem resolução no DNS simulado: nenhuma conexão sairia." });
    }
    const byIp = evaluateRange(resolved, "ipv4", parseIPv4(resolved));
    if (byIp.state === "excluded") {
      return result(input, "name", "excluded", { entry: byIp.entry, resolved, reasons: ["dns.resolved_excluded"], note: "Resolve para " + resolved + ", endereço excluído (" + byIp.entry.env + "). A conexão é recusada depois da resolução." });
    }
    if (byIp.entry && byIp.entry.ceiling != null) entry.ceiling = Math.min(entry.ceiling, byIp.entry.ceiling);
    return result(input, "name", "covered", { entry, resolved, reasons: ["target.in_scope"], note: "Resolve para " + resolved + " no DNS simulado." });
  }
  function withMappedNote(r) {
    r.note = "IPv4 mapeado em IPv6 é o mesmo endereço. " + r.note;
    return r;
  }

  /* ---------- validação (Validate) ---------- */

  const VALIDATE_TARGETS = [
    { id: "t-lab", label: "lab-validate-01", address: "203.0.113.20", envLabel: "Laboratório", assetId: "a-lab" },
    { id: "t-hml", label: "app-hml-02.empresa.example", address: "192.0.2.140", envLabel: "Homologação", assetId: "a-hml" },
    { id: "t-dc", label: "dc-01.empresa.example", address: "198.51.100.5", envLabel: "Produção", assetId: "a-dc" },
    { id: "t-gw", label: "192.0.2.1", address: "192.0.2.1", envLabel: "Gateway de borda" },
    { id: "t-out", label: "203.0.113.200", address: "203.0.113.200", envLabel: "Sem ambiente no escopo" },
  ];
  const REQUEST = {
    technique: "MITRE ATT&CK T1078 · Contas válidas",
    action: "Login com conta de teste autorizada",
    nature: "Evento benigno e detectável, sem alteração",
    level: 3,
  };
  const DIGESTS = { "t-lab": "sha256:a3c9…e104", "t-hml": "sha256:61f0…7b2d", "t-dc": "sha256:d82e…0c51", "t-gw": "sha256:0b7a…f3e9", "t-out": "sha256:5e14…92aa" };

  function findTarget(id) {
    const t = VALIDATE_TARGETS.find((x) => x.id === id || x.assetId === id);
    if (t) return t;
    const a = ASSETS.find((x) => x.id === id && x.isIp);
    return a ? { id: a.id, label: a.name, address: a.address, envLabel: ENV_LABEL[a.env], assetId: a.id } : null;
  }

  /**
   * Motor de política (simulado) para um pedido de validação N3.
   * @param {string} targetId ID de VALIDATE_TARGETS ou de um ativo com endereço
   * @returns {Promise<{target:Object, decision:"allow"|"approval"|"deny", reasons:string[],
   *   message:string, ceiling:?number, lab:boolean, requestDigest:string}>}
   */
  async function evaluatePolicy(targetId) {
    await wait();
    const target = findTarget(targetId);
    if (!target) throw fail("target.unknown", "Alvo desconhecido.");
    const scope = matchScope(target.address);
    const base = { target: clone(target), request: clone(REQUEST), ceiling: scope.entry ? scope.entry.ceiling : null, lab: !!(scope.entry && scope.entry.lab), requestDigest: DIGESTS[target.id] || "sha256:9a02…c7e1" };
    if (scope.state === "excluded") return Object.assign(base, { decision: "deny", reasons: ["target.excluded"], message: "Uma exclusão do escopo cobre o alvo. Exclusões sempre prevalecem." });
    if (scope.state !== "covered") return Object.assign(base, { decision: "deny", reasons: ["target.not_in_scope"], message: "Nenhuma inclusão do escopo cobre o alvo." });
    if (scope.entry.ceiling < REQUEST.level) {
      return Object.assign(base, { decision: "deny", reasons: ["target.in_scope", "level.exceeds_target"], message: "O teto desta entrada do escopo é N" + scope.entry.ceiling + "; a validação pedida é N3. Nada é executado." });
    }
    return Object.assign(base, { decision: "approval", reasons: ["target.in_scope", "approval.required"], message: "Dentro do escopo, com teto N" + scope.entry.ceiling + ". A validação N3 só segue com aprovação humana." });
  }

  /**
   * Aprovação humana do pedido.
   * @param {string} targetId
   * @param {{self:boolean}} opts self = quem aprova é o próprio executor
   * @returns {Promise<{ok:boolean, code?:string, message:string, by?:string, waiver?:string,
   *   signed?:boolean, requestDigest?:string}>}
   */
  async function approve(targetId, opts) {
    const decision = await evaluatePolicy(targetId);
    if (decision.decision !== "approval") throw fail("approval.not_applicable", "Este pedido foi negado pelo motor de política.");
    const self = !!(opts && opts.self);
    if (self && !decision.lab) {
      return { ok: false, code: "approval.self_approval", message: "Fora do laboratório, quem aprova não pode ser quem executa." };
    }
    return {
      ok: true,
      by: self ? "op-01 (executor)" : "op-02 (segundo operador)",
      waiver: self ? "Dispensa de segregação do laboratório registrada em 05/10/2026." : "",
      signed: !decision.lab,
      requestDigest: decision.requestDigest,
      message: "Aprovação vinculada a este pedido exato (SHA-256 do pedido), válida por até 1 hora. Concessão de execução válida por até 10 minutos.",
      signature: !decision.lab ? "Aprovação assinada (Ed25519) pela instalação do segundo operador." : "",
    };
  }

  /**
   * Executa a ação benigna do catálogo e confere a detecção.
   * @param {string} targetId
   * @param {{detected:boolean}} opts detected=false simula detecção ausente
   * @returns {Promise<{marker:string, execution:string, detected:boolean, detection:string, evidence:string}>}
   */
  async function runValidation(targetId, opts) {
    await wait(1200);
    if (!findTarget(targetId)) throw fail("target.unknown", "Alvo desconhecido.");
    const detected = !(opts && opts.detected === false);
    return {
      marker: "hesde-val-7f3a2c",
      execution: "Login com a conta de teste concluído. Marcador do evento: hesde-val-7f3a2c.",
      detected,
      detection: detected
        ? "Detectado: alerta correlacionado no SIEM pelo marcador em 42 s. EDR registrou o evento."
        : "Não detectado em 5 minutos. Lacuna de detecção registrada como achado Alto, com recomendação de regra para o SIEM.",
      evidence: "Evidência sha256:4d1f…a90c registrada e ancorada na trilha. Nenhum artefato restante no alvo.",
    };
  }

  /* ---------- trilha de auditoria ---------- */

  const EVENTS = [
    { seq: 1, at: "14/10/2026 08:58:02", actor: "operador op-01", action: "engagement.create", result: "success", detail: "Empresa Exemplo S.A.", prev: "sha256:0000…0000", hash: "sha256:9c1e…4b07" },
    { seq: 2, at: "14/10/2026 08:59:40", actor: "operador op-02", action: "scope.approve", result: "success", detail: "escopo versão 3", prev: "sha256:9c1e…4b07", hash: "sha256:2f8a…c913" },
    { seq: 3, at: "14/10/2026 09:00:15", actor: "operador op-02", action: "authorization.create", result: "success", detail: "vigência até 31/12/2026 · teto N3", prev: "sha256:2f8a…c913", hash: "sha256:7d40…1e6b" },
    { seq: 4, at: "14/10/2026 09:01:00", actor: "agendador", action: "session.start", result: "success", detail: "janela 09:00–12:00", prev: "sha256:7d40…1e6b", hash: "sha256:b35c…08fa" },
    { seq: 5, at: "14/10/2026 09:01:03", actor: "sistema", action: "policy.decision", result: "allow", detail: "target.in_scope · N1", prev: "sha256:b35c…08fa", hash: "sha256:e91d…7c22" },
    { seq: 6, at: "14/10/2026 09:01:04", actor: "sistema", action: "policy.decision", result: "deny", detail: "target.excluded · 192.0.2.1", prev: "sha256:e91d…7c22", hash: "sha256:41a7…d5e0" },
    { seq: 7, at: "14/10/2026 09:38:51", actor: "sistema", action: "finding.transition", result: "success", detail: "linux.updates.security · aberto → corrigido", prev: "sha256:41a7…d5e0", hash: "sha256:c06f…3a98" },
    { seq: 8, at: "14/10/2026 09:42:30", actor: "sistema", action: "session.finish", result: "success", detail: "3 achados novos · 1 corrigido", prev: "sha256:c06f…3a98", hash: "sha256:5be2…f16d" },
  ];
  const ANCHOR = { seq: 8, algorithm: "Ed25519", key: "ed25519:3f2a…91bc", head: "sha256:5be2…f16d" };
  const REWRITTEN = { 5: "sha256:13b8…a6f4", 6: "sha256:f7c2…5d19", 7: "sha256:8e05…c27b", 8: "sha256:6a9d…04e3" };

  /**
   * Eventos da trilha, como estão gravados. Com tamper, mostra a trilha adulterada da simulação.
   * @param {{tamper?:"none"|"edit"|"rewrite"}} [opts]
   * @returns {Promise<{events:Array<{seq:number, at:string, actor:string, action:string,
   *   result:"success"|"allow"|"deny", detail:string, prev:string, hash:string, tampered?:string[]}>,
   *   anchor:{seq:number, algorithm:string, key:string, head:string}}>}
   */
  async function listAuditEvents(opts) {
    await wait();
    const tamper = (opts && opts.tamper) || "none";
    const events = clone(EVENTS);
    if (tamper !== "none") {
      events[4].detail = "target.in_scope · N3";
      events[4].tampered = ["detail"];
    }
    if (tamper === "rewrite") {
      for (let s = 5; s <= 8; s++) {
        const e = events[s - 1];
        e.hash = REWRITTEN[s];
        if (s > 5) e.prev = REWRITTEN[s - 1];
        e.tampered = (e.tampered || []).concat(s > 5 ? ["prev", "hash"] : ["hash"]);
      }
    }
    return { events, anchor: clone(ANCHOR) };
  }

  /**
   * Verifica a corrente de hashes e a âncora assinada.
   * @param {{tamper:"none"|"edit"|"rewrite"}} opts
   * @returns {Promise<{steps:Array<{seq:number, ok:boolean}>, chainOk:boolean, anchorOk:boolean,
   *   brokenAt:?number, message:string}>}
   */
  async function verifyAuditTrail(opts) {
    await wait(260);
    const tamper = (opts && opts.tamper) || "none";
    if (tamper === "edit") {
      return { steps: [1, 2, 3, 4, 5].map((seq) => ({ seq, ok: seq < 5 })), chainOk: false, anchorOk: false, brokenAt: 5, message: "O hash do evento 5 não confere: alteração detectada a partir deste ponto." };
    }
    const steps = EVENTS.map((e) => ({ seq: e.seq, ok: true }));
    if (tamper === "rewrite") {
      return { steps, chainOk: true, anchorOk: false, brokenAt: null, message: "A corrente foi recalculada, mas não bate com a âncora assinada: reescrita detectada." };
    }
    return { steps, chainOk: true, anchorOk: true, brokenAt: null, message: "Trilha íntegra: 8 eventos encadeados, âncora válida." };
  }

  /* ---------- auditoria, relatórios, integrações, contato ---------- */

  /**
   * Cobertura de hardening por área (percentual de controles conformes).
   * @returns {Promise<Array<{area:string, pct:number}>>}
   */
  async function hardeningCoverage() {
    await wait();
    return [
      { area: "Linux", pct: 82 }, { area: "Windows", pct: 74 }, { area: "Active Directory", pct: 61 },
      { area: "Nuvem", pct: 69 }, { area: "Containers", pct: 77 }, { area: "Kubernetes", pct: 58 },
    ];
  }

  /**
   * Execução de auditoria somente leitura (N1). Devolve as linhas do log e o resumo.
   * @returns {Promise<{lines:Array<{text:string, sev?:Severity}>, summary:string}>}
   */
  async function runAudit() {
    await wait(300);
    return {
      lines: [
        { text: "policy.decision · permitir · target.in_scope · N1" },
        { text: "coleta · srv-erp-01 · configuração efetiva do sshd" },
        { text: "regra linux.ssh.permit_root_login · falhou", sev: "high" },
        { text: "coleta · dc-01 · políticas de senha e MFA" },
        { text: "regra windows.ad.privileged_mfa · falhou", sev: "crit" },
        { text: "coleta · portal · certificado e cabeçalhos HTTP" },
        { text: "1 segredo mascarado antes de gravar", sev: "ok" },
        { text: "regra linux.updates.security · passou · achado corrigido", sev: "ok" },
        { text: "âncora · seq 1.291 assinada (Ed25519)" },
      ],
      summary: "Auditoria concluída sem alterar nenhum sistema. 3 achados novos, 1 corrigido e 1 segredo mascarado antes de gravar. Trilha encadeada e assinada.",
    };
  }

  /**
   * Gera um relatório (simulado).
   * @param {"exec"|"tech"} kind
   * @returns {Promise<{kind:string, pages:number, classification:string, manifest:string, generatedAt:string}>}
   */
  async function generateReport(kind) {
    await wait(1300);
    return {
      kind,
      pages: kind === "tech" ? 31 : 4,
      classification: "CONFIDENCIAL · TLP:AMBER+STRICT",
      manifest: kind === "tech" ? "sha256:b6e1…d042" : "sha256:7a3f…c815",
      generatedAt: "14/10/2026 09:45",
    };
  }

  const INTEGRATIONS = {
    siem: { ok: true }, soar: { ok: false, code: "webhook.hmac_missing", message: "Informe o segredo HMAC do webhook antes de ativar." },
    ticketing: { ok: true }, grc: { ok: true },
  };
  const connected = new Set();

  /**
   * Conecta uma integração (simulação: nenhuma conexão real é feita).
   * @param {"siem"|"soar"|"ticketing"|"grc"} id
   * @returns {Promise<{id:string, status:"connected"}>} rejeita com {code, message} em falha
   */
  async function connectIntegration(id) {
    await wait(900);
    const i = INTEGRATIONS[id];
    if (!i) throw fail("integration.unknown", "Integração desconhecida.");
    if (!i.ok) throw fail(i.code, i.message);
    connected.add(id);
    return { id, status: "connected" };
  }
  /** @param {string} id @returns {Promise<{id:string, status:"disconnected"}>} */
  async function disconnectIntegration(id) {
    await wait(250);
    connected.delete(id);
    return { id, status: "disconnected" };
  }

  /**
   * Envia o pedido de demonstração (simulado: nenhum dado sai do navegador).
   * @param {{name:string, email:string, company:string, area:string, size:string, interest:string,
   *   message?:string, consent:boolean}} payload
   * @returns {Promise<{protocol:string}>} rejeita quando settings.failSubmit está ligado
   */
  async function submitContact(payload) {
    await wait(1100);
    if (settings.failSubmit) throw fail("contact.unavailable", "Não foi possível enviar agora.");
    if (!payload || !payload.consent) throw fail("contact.consent", "Consentimento ausente.");
    return { protocol: "DEMO-00000" };
  }

  /* ---------- ativos e resumo ---------- */

  /**
   * Lista ativos com filtros. Ordem: severidade máxima × 10 + criticidade, decrescente.
   * @param {{query?:string, severities?:Severity[], environment?:"all"|Environment, onlyInternet?:boolean}} [q]
   * @returns {Promise<{items:Array<Asset & {risk:Severity, priority:number, envLabel:string}>,
   *   counts:{crit:number, high:number, mid:number, low:number, ok:number}, total:number}>}
   */
  async function listAssets(q) {
    await wait();
    q = q || {};
    const needle = fold(q.query || "").trim();
    const sevs = q.severities && q.severities.length ? q.severities : null;
    const items = ASSETS.map(decorate).filter((a) => {
      if (q.environment && q.environment !== "all" && a.env !== q.environment) return false;
      if (q.onlyInternet && a.exposure !== "internet") return false;
      if (sevs && sevs.indexOf(a.risk) < 0) return false;
      if (!needle) return true;
      const hay = [a.name, a.address, a.type, a.owner].concat(a.findings.map((x) => x.title)).join(" ");
      return fold(hay).includes(needle);
    }).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
    const counts = { crit: 0, high: 0, mid: 0, low: 0, ok: 0 };
    items.forEach((a) => (a.findings.length ? a.findings.forEach((x) => counts[x.sev]++) : counts.ok++));
    return { items, counts, total: ASSETS.length };
  }

  /** @param {string} id @returns {Promise<Asset & {risk:Severity, priority:number, envLabel:string}>} */
  async function getAsset(id) {
    await wait(220);
    const a = ASSETS.find((x) => x.id === id);
    if (!a) throw fail("asset.unknown", "Ativo não encontrado.");
    return decorate(a);
  }

  /**
   * Resumo da postura, usado no mock do hero e no relatório executivo.
   * @returns {Promise<{exposureIndex:number, exposureIndexLow:number, weekDelta:number, critical:number,
   *   criticalValidated:number, controlsPct:number, controlsDelta:number,
   *   distribution:{crit:number, high:number, mid:number, low:number}, trend:number[],
   *   topFindings:Array<{sev:Severity, title:string, asset:string, detail:string}>, feed:string[]}>}
   */
  async function summary() {
    await wait(0);
    return {
      exposureIndex: 68, exposureIndexLow: 61, weekDelta: -4,
      critical: ASSETS.reduce((n, a) => n + a.findings.filter((x) => x.sev === "crit").length, 0),
      criticalValidated: 2, controlsPct: 87, controlsDelta: 3,
      distribution: { crit: 12, high: 24, mid: 34, low: 30 },
      trend: [78, 77, 77, 76, 76, 75, 76, 74, 74, 73, 73, 72, 73, 72, 71, 72, 71, 70, 71, 70, 70, 69, 70, 69, 69, 68, 69, 68, 68, 68],
      topFindings: [
        { sev: "crit", title: "Contas privilegiadas sem MFA", asset: "dc-01", detail: "Prioridade 1 · Corrigir em 7 dias · ativo crítico · sem MFA" },
        { sev: "crit", title: "VPN fora do suporte", asset: "vpn-borda-01", detail: "Prioridade 2 · Corrigir em 7 dias · exposto à internet · KEV" },
        { sev: "high", title: "Banco acessível da rede de usuários", asset: "db-clientes-01", detail: "Prioridade 3 · Corrigir em 30 dias · dados pessoais" },
        { sev: "mid", title: "Certificado expira em 12 dias", asset: "portal", detail: "Prioridade 4 · Corrigir em 90 dias · exposto à internet" },
      ],
      feed: [
        "policy.decision permitir · target.in_scope · N2",
        "policy.decision negar · target.excluded · 192.0.2.1",
        "segredo mascarado antes de gravar",
        "âncora seq 1.284 assinada (Ed25519)",
        "coleta · portal.empresa.example · certificado TLS",
        "finding.transition · linux.updates.security · corrigido",
      ],
    };
  }

  /**
   * Escopo aprovado vigente.
   * @returns {Promise<{version:number, status:string, authorizationUntil:string, entries:Array<Object>}>}
   */
  async function getScope() {
    await wait();
    return clone(SCOPE);
  }

  /** @param {string} value @returns {Promise<ReturnType<typeof matchScope>>} */
  async function checkScope(value) {
    await wait(260);
    return matchScope(value);
  }

  /** @returns {Promise<Array<Object>>} Alvos do pedido de validação */
  async function listValidateTargets() {
    await wait(0);
    return clone(VALIDATE_TARGETS);
  }

  global.HesdeApi = {
    settings,
    listAssets, getAsset, summary,
    listValidateTargets, evaluatePolicy, approve, runValidation,
    getScope, checkScope,
    listAuditEvents, verifyAuditTrail,
    hardeningCoverage, runAudit,
    generateReport,
    connectIntegration, disconnectIntegration,
    submitContact,
    /** Constantes de leitura para a interface. */
    meta: { DEADLINE_DAYS, ENV_LABEL, MASK },
  };
})(window);
