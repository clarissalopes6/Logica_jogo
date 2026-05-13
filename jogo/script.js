const missions = [
  {
    title: "Missão 01: Porta de serviço",
    difficulty: "Inicial",
    seconds: 120,
    scene: "door",
    expected: "C AND NOT K",
    objective:
      "Abra a porta somente quando o cartão for válido e a câmera estiver desligada.",
    variables: {
      C: { label: "cartão válido", value: true },
      K: { label: "câmera ligada", value: false },
    },
  },
  {
    title: "Missão 02: Login fantasma",
    difficulty: "Básico",
    seconds: 135,
    scene: "card",
    expected: "L AND S AND NOT B",
    objective:
      "Libere o login apenas se o usuário e a senha estiverem corretos, e a conta não estiver bloqueada.",
    variables: {
      L: { label: "login correto", value: true },
      S: { label: "senha correta", value: true },
      B: { label: "conta bloqueada", value: false },
    },
  },
  {
    title: "Missão 03: Janela de manutenção",
    difficulty: "Básico",
    seconds: 150,
    scene: "server",
    expected: "A OR M",
    objective:
      "O servidor aceita entrada se o usuário for administrador ou se o modo manutenção estiver ativo.",
    variables: {
      A: { label: "usuário administrador", value: false },
      M: { label: "modo manutenção ativo", value: true },
    },
  },
  {
    title: "Missão 04: Token corporativo",
    difficulty: "Intermediário",
    seconds: 165,
    scene: "shield",
    expected: "A -> T",
    objective:
      "Configure a regra: se o usuário for administrador, então o token precisa estar válido.",
    variables: {
      A: { label: "usuário administrador", value: true },
      T: { label: "token válido", value: true },
    },
  },
  {
    title: "Missão 05: Alarme silencioso",
    difficulty: "Intermediário",
    seconds: 170,
    scene: "alarm",
    expected: "NOT I AND F",
    objective:
      "Crie uma condição segura em que não haja invasão detectada e o firewall esteja funcionando.",
    variables: {
      I: { label: "invasão detectada", value: false },
      F: { label: "firewall funcionando", value: true },
    },
  },
  {
    title: "Missão 06: Cofre de chaves",
    difficulty: "Avançado",
    seconds: 190,
    scene: "vault",
    expected: "(P OR Q) AND NOT R",
    objective:
      "Abra o cofre se pelo menos uma chave parcial estiver ativa e o bloqueio remoto estiver desligado.",
    variables: {
      P: { label: "chave parcial alfa", value: true },
      Q: { label: "chave parcial beta", value: false },
      R: { label: "bloqueio remoto ligado", value: false },
    },
  },
  {
    title: "Missão 07: Espelho de credenciais",
    difficulty: "Avançado",
    seconds: 210,
    scene: "biometric",
    expected: "D <-> V",
    objective:
      "O acesso de diagnóstico deve estar ativo se e somente se a verificação biométrica estiver válida.",
    variables: {
      D: { label: "diagnóstico ativo", value: true },
      V: { label: "biometria válida", value: true },
    },
  },
  {
    title: "Missão 08: Núcleo central",
    difficulty: "Final",
    seconds: 240,
    scene: "core",
    expected: "(A AND T AND NOT R) OR (M AND NOT F)",
    objective:
      "Invada o núcleo quando houver administrador com token válido e sem rastreamento, ou quando o modo manutenção estiver ativo e o firewall estiver desligado.",
    variables: {
      A: { label: "administrador conectado", value: true },
      T: { label: "token mestre válido", value: true },
      R: { label: "rastreamento ativo", value: false },
      M: { label: "modo manutenção ativo", value: false },
      F: { label: "firewall ligado", value: true },
    },
  },
];

const state = {
  missionIndex: 0,
  score: 0,
  trace: 0,
  remainingSeconds: missions[0].seconds,
  timerId: null,
  startedAt: Date.now(),
};

const elements = {
  matrix: document.querySelector("#matrix"),
  missionTitle: document.querySelector("#missionTitle"),
  missionCounter: document.querySelector("#missionCounter"),
  difficulty: document.querySelector("#difficulty"),
  variablesList: document.querySelector("#variablesList"),
  objectiveText: document.querySelector("#objectiveText"),
  terminalLog: document.querySelector("#terminalLog"),
  systemStage: document.querySelector("#systemStage"),
  stageTitle: document.querySelector("#stageTitle"),
  stageState: document.querySelector("#stageState"),
  sceneArea: document.querySelector("#sceneArea"),
  logicFlow: document.querySelector("#logicFlow"),
  input: document.querySelector("#expressionInput"),
  submit: document.querySelector("#submitBtn"),
  clear: document.querySelector("#clearBtn"),
  timer: document.querySelector("#timer"),
  trace: document.querySelector("#trace"),
  score: document.querySelector("#score"),
  feedback: document.querySelector("#feedback"),
  endModal: document.querySelector("#endModal"),
  finalStats: document.querySelector("#finalStats"),
  restart: document.querySelector("#restartBtn"),
};

const tokenTypes = {
  NOT: "NOT",
  AND: "AND",
  OR: "OR",
  IMPLIES: "IMPLIES",
  IFF: "IFF",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  VAR: "VAR",
};

function startGame() {
  state.missionIndex = 0;
  state.score = 0;
  state.trace = 0;
  state.startedAt = Date.now();
  elements.endModal.hidden = true;
  loadMission();
}

function loadMission() {
  const mission = currentMission();
  state.remainingSeconds = mission.seconds;
  elements.input.value = "";
  elements.missionTitle.textContent = mission.title;
  elements.missionCounter.textContent = `${state.missionIndex + 1}/${missions.length}`;
  elements.difficulty.textContent = mission.difficulty;
  elements.objectiveText.textContent = mission.objective;
  elements.feedback.textContent = "Aguardando expressão...";
  renderVariables(mission);
  renderScene(mission);
  updateLogicFlow("");
  renderScoreboard();
  resetLog([
    ["warn", `[SISTEMA] ${mission.title}`],
    ["", `[OBJETIVO] ${mission.objective}`],
    ["", "[TERMINAL] Digite uma expressão proposicional equivalente ao objetivo."],
  ]);
  startTimer();
}

function currentMission() {
  return missions[state.missionIndex];
}

function renderVariables(mission) {
  elements.variablesList.innerHTML = "";
  Object.entries(mission.variables).forEach(([name, info]) => {
    const item = document.createElement("div");
    item.className = "variable";
    item.innerHTML = `
      <code>${name}</code>
      <span>${info.label}</span>
      <b class="truth ${info.value ? "" : "false"}">${info.value ? "V" : "F"}</b>
    `;
    elements.variablesList.appendChild(item);
  });
}

function renderScene(mission) {
  const scenes = {
    door: {
      title: "Porta biométrica",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="door-frame"><div class="door-panel"><span class="door-light"></span></div></div>
          <div class="keypad"><i></i><i></i><i></i><i></i></div>
        </div>
      `,
    },
    card: {
      title: "Leitor de credenciais",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="access-card"></div>
          <div class="scanner"></div>
        </div>
      `,
    },
    server: {
      title: "Cluster de manutenção",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="server-stack"><span></span><span></span><span></span></div>
        </div>
      `,
    },
    shield: {
      title: "Firewall condicional",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="shield"></div>
        </div>
      `,
    },
    alarm: {
      title: "Alarme silencioso",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="alarm-tower"></div>
          <div class="alarm-base"></div>
        </div>
      `,
    },
    vault: {
      title: "Cofre de chaves",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="vault"><div class="vault-wheel"></div></div>
        </div>
      `,
    },
    biometric: {
      title: "Espelho biométrico",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="biometric"></div>
        </div>
      `,
    },
    core: {
      title: "Núcleo central",
      html: `
        <div class="stage-visual">
          <div class="data-beam"></div>
          <div class="core-ring"></div>
        </div>
      `,
    },
  };

  const scene = scenes[mission.scene] ?? scenes.server;
  elements.stageTitle.textContent = scene.title;
  elements.stageState.textContent = "Aguardando";
  elements.systemStage.className = `system-stage scene-${mission.scene}`;
  elements.systemStage.style.setProperty("--charge", 0);
  elements.sceneArea.innerHTML = scene.html;
}

function updateLogicFlow(raw) {
  const trimmed = raw.trim();
  const expectedLength = Math.max(1, currentMission().expected.length);
  const charge = Math.min(100, Math.round((trimmed.length / expectedLength) * 100));
  elements.systemStage.style.setProperty("--charge", charge);

  elements.logicFlow.innerHTML = "";
  if (!trimmed) {
    elements.logicFlow.innerHTML = '<span class="flow-empty">Fluxo lógico aguardando entrada...</span>';
    setStageMode("idle");
    return;
  }

  setStageMode("typing");
  const pieces = trimmed.match(/<->|->|[A-Za-z]+|[¬∧∨→↔!~&|^()]|./g) ?? [];
  pieces.slice(-16).forEach((piece) => {
    if (/\s/.test(piece)) return;
    const chip = document.createElement("span");
    chip.className = `flow-chip ${chipType(piece)}`;
    chip.textContent = piece.toUpperCase();
    elements.logicFlow.appendChild(chip);
  });
}

function chipType(piece) {
  const normalized = piece.toUpperCase();
  if (["¬", "!", "~", "NOT", "NAO", "NÃO"].includes(normalized)) return "negation";
  if (["∧", "∨", "→", "↔", "AND", "OR", "E", "OU", "->", "<->", "&", "|", "^"].includes(normalized)) {
    return "operator";
  }
  return "";
}

function setStageMode(mode) {
  elements.systemStage.classList.remove("typing", "success", "error");
  if (mode !== "idle") {
    elements.systemStage.classList.add(mode);
  }
  const labels = {
    idle: "Aguardando",
    typing: "Analisando",
    success: "Liberado",
    error: "Bloqueado",
  };
  elements.stageState.textContent = labels[mode] ?? labels.idle;
}

function pulseStage(mode) {
  setStageMode(mode);
  window.setTimeout(() => {
    if (mode !== "success") {
      updateLogicFlow(elements.input.value);
    }
  }, 520);
}

function resetLog(lines) {
  elements.terminalLog.innerHTML = "";
  lines.forEach(([type, text]) => addLog(text, type));
}

function addLog(text, type = "") {
  const line = document.createElement("p");
  line.className = `log-line ${type}`.trim();
  line.textContent = `> ${text}`;
  elements.terminalLog.appendChild(line);
  elements.terminalLog.scrollTop = elements.terminalLog.scrollHeight;
}

function startTimer() {
  clearInterval(state.timerId);
  renderTimer();
  state.timerId = setInterval(() => {
    state.remainingSeconds -= 1;
    renderTimer();

    if (state.remainingSeconds <= 0) {
      state.trace = 100;
      renderScoreboard();
      addLog("[ALERTA] Tempo esgotado. O sistema completou o rastreamento.", "error");
      pulseStage("error");
      endGame(false);
    }
  }, 1000);
}

function renderTimer() {
  const minutes = Math.floor(Math.max(0, state.remainingSeconds) / 60);
  const seconds = Math.max(0, state.remainingSeconds) % 60;
  elements.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderScoreboard() {
  elements.trace.textContent = `${state.trace}%`;
  elements.score.textContent = String(state.score);
}

function submitExpression() {
  const raw = elements.input.value.trim();
  if (!raw) {
    setFeedback("Digite uma expressão antes de executar.", "warn");
    pulseStage("error");
    return;
  }

  const mission = currentMission();
  try {
    const userAst = parse(raw);
    const expectedAst = parse(mission.expected);
    const variables = Object.keys(mission.variables);
    const equivalent = areEquivalent(userAst, expectedAst, variables);
    const currentValue = evaluate(userAst, valuesFromMission(mission));

    addLog(`[ENTRADA] ${raw}`);
    addLog(`[ESTADO ATUAL] ${formatSubstitution(userAst, valuesFromMission(mission))}`);
    addLog(`[RESULTADO] ${currentValue ? "VERDADEIRO" : "FALSO"}`, currentValue ? "success" : "error");

    if (equivalent && currentValue) {
      const gained = Math.max(50, state.remainingSeconds * 4 - state.trace);
      state.score += gained;
      setFeedback(`Bypass aceito. +${gained} pontos.`, "success");
      addLog("[ACESSO] Expressão equivalente ao objetivo. Sistema invadido.", "success");
      pulseStage("success");
      nextMission();
      return;
    }

    state.trace = Math.min(100, state.trace + 15);
    renderScoreboard();
    if (!equivalent) {
      setFeedback("A expressão não representa exatamente a regra do objetivo.", "error");
      addLog("[NEGADO] A fórmula não é equivalente à condição exigida.", "error");
    } else {
      setFeedback("A regra está correta, mas neste estado ela resultou em falso.", "error");
      addLog("[NEGADO] A fórmula ficou falsa no estado atual do sistema.", "error");
    }
    pulseStage("error");
    failOrContinue();
  } catch (error) {
    state.trace = Math.min(100, state.trace + 10);
    renderScoreboard();
    setFeedback(error.message, "error");
    addLog(`[ERRO] ${error.message}`, "error");
    pulseStage("error");
    failOrContinue();
  }
}

function nextMission() {
  clearInterval(state.timerId);
  renderScoreboard();
  setTimeout(() => {
    state.missionIndex += 1;
    if (state.missionIndex >= missions.length) {
      endGame(true);
    } else {
      loadMission();
    }
  }, 900);
}

function failOrContinue() {
  renderScoreboard();
  if (state.trace >= 100) {
    endGame(false);
  }
}

function endGame(success) {
  clearInterval(state.timerId);
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  elements.finalStats.textContent = success
    ? `Você concluiu todas as missões com ${state.score} pontos em ${minutes}m ${seconds}s.`
    : `Rastreamento chegou a 100%. Pontuação final: ${state.score}.`;
  elements.endModal.hidden = false;
}

function setFeedback(message, type) {
  elements.feedback.textContent = message;
  elements.feedback.style.color =
    type === "success" ? "var(--green)" : type === "error" ? "var(--red)" : "var(--amber)";
}

function valuesFromMission(mission) {
  return Object.fromEntries(
    Object.entries(mission.variables).map(([name, info]) => [name, info.value]),
  );
}

function formatSubstitution(ast, values) {
  return formatAst(ast, values);
}

function formatAst(node, values) {
  if (node.type === "VAR") {
    return `${node.name}=${values[node.name] ? "V" : "F"}`;
  }
  if (node.type === "NOT") {
    return `¬(${formatAst(node.value, values)})`;
  }
  return `(${formatAst(node.left, values)} ${node.symbol} ${formatAst(node.right, values)})`;
}

function tokenize(input) {
  const tokens = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];
    const rest = input.slice(index);

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (rest.startsWith("<->") || rest.startsWith("<=>")) {
      tokens.push({ type: tokenTypes.IFF, value: "↔" });
      index += 3;
      continue;
    }

    if (rest.startsWith("->") || rest.startsWith("=>")) {
      tokens.push({ type: tokenTypes.IMPLIES, value: "→" });
      index += 2;
      continue;
    }

    if (char === "¬" || char === "!" || char === "~") {
      tokens.push({ type: tokenTypes.NOT, value: "¬" });
      index += 1;
      continue;
    }

    if (char === "∧" || char === "&" || char === "^") {
      tokens.push({ type: tokenTypes.AND, value: "∧" });
      index += 1;
      continue;
    }

    if (char === "∨" || char === "|") {
      tokens.push({ type: tokenTypes.OR, value: "∨" });
      index += 1;
      continue;
    }

    if (char === "→") {
      tokens.push({ type: tokenTypes.IMPLIES, value: "→" });
      index += 1;
      continue;
    }

    if (char === "↔") {
      tokens.push({ type: tokenTypes.IFF, value: "↔" });
      index += 1;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: tokenTypes.LPAREN, value: char });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: tokenTypes.RPAREN, value: char });
      index += 1;
      continue;
    }

    const word = rest.match(/^[A-Za-z][A-Za-z0-9_]*/);
    if (word) {
      const value = word[0].toUpperCase();
      if (value === "NOT" || value === "NAO" || value === "NÃO") {
        tokens.push({ type: tokenTypes.NOT, value: "¬" });
      } else if (value === "AND" || value === "E") {
        tokens.push({ type: tokenTypes.AND, value: "∧" });
      } else if (value === "OR" || value === "OU") {
        tokens.push({ type: tokenTypes.OR, value: "∨" });
      } else {
        tokens.push({ type: tokenTypes.VAR, value });
      }
      index += word[0].length;
      continue;
    }

    throw new Error(`Símbolo não reconhecido: "${char}".`);
  }

  return tokens;
}

function parse(input) {
  const parser = new Parser(tokenize(input));
  const ast = parser.parseExpression();
  if (!parser.isAtEnd()) {
    throw new Error(`Token inesperado: "${parser.peek().value}".`);
  }
  return ast;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parseExpression() {
    return this.parseIff();
  }

  parseIff() {
    let expr = this.parseImplies();
    while (this.match(tokenTypes.IFF)) {
      const operator = this.previous();
      const right = this.parseImplies();
      expr = { type: "IFF", symbol: operator.value, left: expr, right };
    }
    return expr;
  }

  parseImplies() {
    const expr = this.parseOr();
    if (this.match(tokenTypes.IMPLIES)) {
      const operator = this.previous();
      const right = this.parseImplies();
      return { type: "IMPLIES", symbol: operator.value, left: expr, right };
    }
    return expr;
  }

  parseOr() {
    let expr = this.parseAnd();
    while (this.match(tokenTypes.OR)) {
      const operator = this.previous();
      const right = this.parseAnd();
      expr = { type: "OR", symbol: operator.value, left: expr, right };
    }
    return expr;
  }

  parseAnd() {
    let expr = this.parseNot();
    while (this.match(tokenTypes.AND)) {
      const operator = this.previous();
      const right = this.parseNot();
      expr = { type: "AND", symbol: operator.value, left: expr, right };
    }
    return expr;
  }

  parseNot() {
    if (this.match(tokenTypes.NOT)) {
      return { type: "NOT", value: this.parseNot() };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    if (this.match(tokenTypes.VAR)) {
      return { type: "VAR", name: this.previous().value };
    }
    if (this.match(tokenTypes.LPAREN)) {
      const expr = this.parseExpression();
      if (!this.match(tokenTypes.RPAREN)) {
        throw new Error("Faltou fechar parêntese.");
      }
      return expr;
    }
    throw new Error("Expressão incompleta ou mal formada.");
  }

  match(...types) {
    if (types.some((type) => this.check(type))) {
      this.advance();
      return true;
    }
    return false;
  }

  check(type) {
    return !this.isAtEnd() && this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current += 1;
    return this.previous();
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }
}

function evaluate(node, values) {
  switch (node.type) {
    case "VAR":
      if (!(node.name in values)) {
        throw new Error(`Variável "${node.name}" não existe nesta missão.`);
      }
      return values[node.name];
    case "NOT":
      return !evaluate(node.value, values);
    case "AND":
      return evaluate(node.left, values) && evaluate(node.right, values);
    case "OR":
      return evaluate(node.left, values) || evaluate(node.right, values);
    case "IMPLIES":
      return !evaluate(node.left, values) || evaluate(node.right, values);
    case "IFF":
      return evaluate(node.left, values) === evaluate(node.right, values);
    default:
      throw new Error("Expressão inválida.");
  }
}

function areEquivalent(leftAst, rightAst, variables) {
  const totalRows = 2 ** variables.length;
  for (let row = 0; row < totalRows; row += 1) {
    const values = {};
    variables.forEach((name, index) => {
      values[name] = Boolean(row & (1 << index));
    });

    if (evaluate(leftAst, values) !== evaluate(rightAst, values)) {
      return false;
    }
  }
  return true;
}

function insertAtCursor(textarea, value) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const padded = value === "¬" || value === "(" || value === ")" ? value : ` ${value} `;
  textarea.value = `${before}${padded}${after}`;
  const cursor = before.length + padded.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  updateLogicFlow(textarea.value);
}

function setupMatrix() {
  const canvas = elements.matrix;
  const ctx = canvas.getContext("2d");
  const glyphs = "01¬∧∨→↔ABCDEFTKLMNPQRS";
  let columns = [];

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    columns = Array.from({ length: Math.ceil(window.innerWidth / 18) }, () =>
      Math.floor(Math.random() * window.innerHeight),
    );
  }

  function draw() {
    ctx.fillStyle = "rgba(7, 16, 15, 0.12)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = "rgba(83, 255, 176, 0.62)";
    ctx.font = "16px Consolas, monospace";

    columns.forEach((y, index) => {
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = index * 18;
      ctx.fillText(glyph, x, y);
      columns[index] = y > window.innerHeight + Math.random() * 900 ? 0 : y + 18;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
}

document.querySelectorAll("[data-insert]").forEach((button) => {
  button.addEventListener("click", () => insertAtCursor(elements.input, button.dataset.insert));
});

elements.submit.addEventListener("click", submitExpression);
elements.clear.addEventListener("click", () => {
  elements.input.value = "";
  updateLogicFlow("");
  elements.input.focus();
});
elements.restart.addEventListener("click", startGame);
elements.input.addEventListener("input", () => updateLogicFlow(elements.input.value));
elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    submitExpression();
  }
});

setupMatrix();
startGame();
