const STATUS = Object.freeze({
  AC: "AC",
  WA: "WA",
  PE: "PE",
  UNSUBMITTED: "未提出",
});

export function normalizeToken(value) {
  return String(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replaceAll("π", "pi")
    .replaceAll("\\pi", "pi")
    .replaceAll("−", "-")
    .replaceAll("－", "-")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("{", "(")
    .replaceAll("}", ")")
    .replace(/\s+/g, "")
    .replaceAll("*", "");
}

function tokenizeNumeric(value) {
  const normalized = String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("π", "pi")
    .replaceAll("\\pi", "pi")
    .replaceAll("−", "-")
    .replaceAll("－", "-")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("{", "(")
    .replaceAll("}", ")")
    .replace(/\s+/g, "");

  const tokens = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const rest = normalized.slice(cursor);
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/);
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      cursor += number[0].length;
      continue;
    }
    const identifier = rest.match(/^(pi|e|sqrt)/);
    if (identifier) {
      tokens.push({ type: "identifier", value: identifier[0] });
      cursor += identifier[0].length;
      continue;
    }
    const operator = rest[0];
    if ("+-*/^()".includes(operator)) {
      tokens.push({ type: "operator", value: operator });
      cursor += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

function evaluateNumeric(value) {
  const tokens = tokenizeNumeric(value);
  if (!tokens || tokens.length === 0) return null;
  let cursor = 0;

  const peek = (operator) => tokens[cursor]?.value === operator;
  const consume = (operator) => {
    if (!peek(operator)) throw new Error("Unexpected token");
    cursor += 1;
  };

  const parsePrimary = () => {
    const token = tokens[cursor];
    if (!token) throw new Error("Unexpected end");
    if (token.type === "number") {
      cursor += 1;
      return token.value;
    }
    if (token.type === "identifier" && token.value !== "sqrt") {
      cursor += 1;
      return token.value === "pi" ? Math.PI : Math.E;
    }
    if (token.type === "identifier" && token.value === "sqrt") {
      cursor += 1;
      consume("(");
      const result = parseExpression();
      consume(")");
      return Math.sqrt(result);
    }
    if (peek("(")) {
      consume("(");
      const result = parseExpression();
      consume(")");
      return result;
    }
    throw new Error("Unexpected token");
  };

  const parseUnary = () => {
    if (peek("+")) {
      consume("+");
      return parseUnary();
    }
    if (peek("-")) {
      consume("-");
      return -parseUnary();
    }
    return parsePrimary();
  };

  const parsePower = () => {
    let value = parseUnary();
    if (peek("^")) {
      consume("^");
      value **= parsePower();
    }
    return value;
  };

  const parseTerm = () => {
    let value = parsePower();
    while (peek("*") || peek("/")) {
      if (peek("*")) {
        consume("*");
        value *= parsePower();
      } else {
        consume("/");
        value /= parsePower();
      }
    }
    return value;
  };

  function parseExpression() {
    let value = parseTerm();
    while (peek("+") || peek("-")) {
      if (peek("+")) {
        consume("+");
        value += parseTerm();
      } else {
        consume("-");
        value -= parseTerm();
      }
    }
    return value;
  }

  try {
    const result = parseExpression();
    if (cursor !== tokens.length || !Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

function equivalent(actual, expected) {
  if (normalizeToken(actual) === normalizeToken(expected)) return true;
  const actualNumber = evaluateNumeric(actual);
  const expectedNumber = evaluateNumeric(expected);
  if (actualNumber === null || expectedNumber === null) return false;
  const scale = Math.max(1, Math.abs(actualNumber), Math.abs(expectedNumber));
  return Math.abs(actualNumber - expectedNumber) <= 1e-10 * scale;
}

export function parseSubmission(text, maximumQuestionNumber) {
  const submissions = new Map();
  const lineErrors = [];
  const duplicated = new Set();

  String(text)
    .split(/\r?\n/)
    .forEach((rawLine, index) => {
      const line = rawLine.normalize("NFKC").trim();
      if (!line || line.startsWith("#")) return;
      const match = line.match(/^(\d+)\s*(?::|\s)\s*(.+)$/);
      if (!match) {
        lineErrors.push({ line: index + 1, message: "「問題番号 回答」の形式で入力してください。", raw: rawLine });
        return;
      }
      const number = Number(match[1]);
      if (!Number.isInteger(number) || number < 1 || number > maximumQuestionNumber) {
        lineErrors.push({ line: index + 1, message: `問題番号は1から${maximumQuestionNumber}までです。`, raw: rawLine });
        return;
      }
      if (submissions.has(number)) duplicated.add(number);
      const answers = match[2].replaceAll(",", " ").split(/\s+/).filter(Boolean);
      submissions.set(number, { answers, raw: match[2].trim(), line: index + 1 });
    });

  return { submissions, lineErrors, duplicated };
}

export function gradeSubmission(text, questions) {
  const { submissions, lineErrors, duplicated } = parseSubmission(text, questions.length);
  const results = questions.map((question) => {
    const submitted = submissions.get(question.number);
    if (!submitted) return { ...question, status: STATUS.UNSUBMITTED, submitted: "" };
    if (duplicated.has(question.number)) {
      return { ...question, status: STATUS.PE, submitted: submitted.raw, message: "同じ問題番号が複数あります。" };
    }
    if (submitted.answers.length !== question.answers.length) {
      return {
        ...question,
        status: STATUS.PE,
        submitted: submitted.raw,
        message: `回答数は${question.answers.length}個です。`,
      };
    }
    const correct = submitted.answers.every((answer, index) =>
      question.answers[index].some((expected) => equivalent(answer, expected)),
    );
    return { ...question, status: correct ? STATUS.AC : STATUS.WA, submitted: submitted.raw };
  });

  const summary = Object.values(STATUS).reduce((counts, status) => ({ ...counts, [status]: 0 }), {});
  results.forEach((result) => {
    summary[result.status] += 1;
  });
  return { results, summary, lineErrors };
}

export { STATUS };
