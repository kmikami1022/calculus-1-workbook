function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function fraction(numerator, denominator = 1) {
  if (denominator < 0) return fraction(-numerator, -denominator);
  const divisor = gcd(numerator, denominator);
  const top = numerator / divisor;
  const bottom = denominator / divisor;
  return bottom === 1 ? String(top) : `${top}/${bottom}`;
}

function factorial(n) {
  let value = 1;
  for (let index = 2; index <= n; index += 1) value *= index;
  return value;
}

function binomial(n, k) {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function exponentialCosineNumerator(degree, a, b) {
  let numerator = 0;
  for (let cosineDegree = 0; cosineDegree <= degree; cosineDegree += 2) {
    const sign = (cosineDegree / 2) % 2 ? -1 : 1;
    numerator += sign
      * binomial(degree, cosineDegree)
      * a ** (degree - cosineDegree)
      * b ** cosineDegree;
  }
  return numerator;
}

function integer(rng, minimum, maximum) {
  return Math.floor(rng() * (maximum - minimum + 1)) + minimum;
}

function signedInteger(rng, minimum, maximum) {
  const value = integer(rng, minimum, maximum);
  return rng() < 0.5 ? -value : value;
}

function item(templateId, prompt, answer) {
  return { templateId, prompt, answers: [[String(answer)]] };
}

function variableTerm(coefficient, variable, leading = false) {
  const sign = coefficient < 0 ? "-" : leading ? "" : "+";
  const magnitude = Math.abs(coefficient) === 1 ? "" : Math.abs(coefficient);
  return `${sign}${magnitude}${variable}`;
}

function constantTerm(value) {
  return value < 0 ? String(value) : `+${value}`;
}

function variablePower(variable, exponent) {
  return exponent === 1 ? variable : `${variable}^{${exponent}}`;
}

function powerOfX(exponent) {
  return variablePower("x", exponent);
}

function denominator(coefficient, variable) {
  return coefficient === 1 ? variable : `${coefficient}${variable}`;
}

function piOver(denominatorValue) {
  return denominatorValue === 1 ? "\\pi" : `\\pi/${denominatorValue}`;
}

function makeTemplates(prefix, specs, build, templateFamily = prefix) {
  return specs.map((spec) => {
    const generate = (rng) => {
      const result = build(spec, rng);
      return {
        templateFamily,
        ...item(`${prefix}-${spec}`, result.prompt, result.answer),
      };
    };
    generate.templateFamily = templateFamily;
    return generate;
  });
}

const LIMITS = [
  ...makeTemplates("limit-difference", [2, 3, 4, 5, 6], (degree, rng) => {
    const a = integer(rng, 1, 4);
    return {
      prompt: `$\\displaystyle \\lim_{x\\to ${a}}\\frac{x^${degree}-${a ** degree}}{x-${a}}$ を求めよ。`,
      answer: degree * a ** (degree - 1),
    };
  }),
  ...makeTemplates("limit-rational", [1, 2, 3, 4, 5], (degree, rng) => {
    const a = integer(rng, 1, 8);
    const c = integer(rng, 2, 9);
    const b = signedInteger(rng, 1, 9);
    const d = signedInteger(rng, 1, 9);
    const xPower = powerOfX(degree);
    return {
      prompt: `$\\displaystyle \\lim_{x\\to\\infty}\\frac{${variableTerm(a, xPower, true)}${constantTerm(b)}}{${variableTerm(c, xPower, true)}${constantTerm(d)}}$ を求めよ。`,
      answer: fraction(a, c),
    };
  }),
  ...makeTemplates("limit-sine", [1, 2, 3, 4, 5], (scale, rng) => {
    const k = integer(rng, 1, 9);
    return {
      prompt: `$\\displaystyle \\lim_{x\\to0}\\frac{\\sin(${variableTerm(k, "x", true)})}{${denominator(scale, "x")}}$ を求めよ。`,
      answer: fraction(k, scale),
    };
  }),
  ...makeTemplates("limit-tangent", [1, 2, 3, 4, 5], (scale, rng) => {
    const k = integer(rng, 1, 8);
    return {
      prompt: `$\\displaystyle \\lim_{x\\to0}\\frac{\\tan(${variableTerm(k, "x", true)})}{${denominator(scale, "x")}}$ を求めよ。`,
      answer: fraction(k, scale),
    };
  }),
  ...makeTemplates("limit-exponential", [1, 2, 3, 4, 5], (scale, rng) => {
    const k = signedInteger(rng, 1, 6);
    return {
      prompt: `$\\displaystyle \\lim_{x\\to0}\\frac{e^{${variableTerm(k, "x", true)}}-1}{${denominator(scale, "x")}}$ を求めよ。`,
      answer: fraction(k, scale),
    };
  }),
  ...makeTemplates("limit-cosine", [1, 2, 3, 4, 5], (scale, rng) => {
    const k = integer(rng, 1, 7);
    return {
      prompt: `$\\displaystyle \\lim_{x\\to0}\\frac{1-\\cos(${variableTerm(k, "x", true)})}{${denominator(scale, "x^2")}}$ を求めよ。`,
      answer: fraction(k ** 2, 2 * scale),
    };
  }),
  ...makeTemplates("limit-root", [2, 3, 4, 5, 6], (root) => ({
    prompt: `$\\displaystyle \\lim_{x\\to0}\\frac{\\sqrt{x+${root ** 2}}-${root}}{x}$ を求めよ。`,
    answer: fraction(1, 2 * root),
  })),
];

const DIFFERENTIATION = [
  ...makeTemplates("diff-power", [2, 3, 4, 5, 6], (degree, rng) => {
    const point = signedInteger(rng, 1, 3);
    return {
      prompt: `$f(x)=x^{${degree}}$ とする。$f'(${point})$ を求めよ。`,
      answer: degree * point ** (degree - 1),
    };
  }),
  ...makeTemplates("diff-exponential", [1, 2, 3, 4, 5], (magnitude, rng) => {
    const k = rng() < 0.5 ? -magnitude : magnitude;
    return { prompt: `$f(x)=e^{${variableTerm(k, "x", true)}}$ とする。$f'(0)$ を求めよ。`, answer: k };
  }),
  ...makeTemplates("diff-sine", [1, 2, 3, 4, 5], (k) => ({
    prompt: `$f(x)=\\sin(${variableTerm(k, "x", true)})$ とする。$f'(0)$ を求めよ。`,
    answer: k,
  })),
  ...makeTemplates("diff-cosine", [1, 2, 3, 4, 5], (k) => ({
    prompt: `$f(x)=\\cos(${variableTerm(k, "x", true)})$ とする。$f'(${piOver(2 * k)})$ を求めよ。`,
    answer: -k,
  })),
  ...makeTemplates("diff-reciprocal", [1, 2, 3, 4, 5], (a, rng) => {
    const b = integer(rng, 2, 9);
    return {
      prompt: `$f(x)=\\dfrac{1}{${variableTerm(a, "x", true)}+${b}}$ とする。$f'(0)$ を求めよ。`,
      answer: fraction(-a, b ** 2),
    };
  }),
  ...makeTemplates("diff-log", [1, 2, 3, 4, 5], (a, rng) => {
    const b = integer(rng, 1, 8);
    return {
      prompt: `$f(x)=\\log(${variableTerm(a, "x", true)}+${b})$ とする。$f'(0)$ を求めよ。`,
      answer: fraction(a, b),
    };
  }),
  ...makeTemplates("diff-product-exp", [1, 2, 3, 4, 5], (power, rng) => {
    let k = integer(rng, 1, 5);
    if (k === power) k = k === 5 ? 4 : k + 1;
    return {
      prompt: `$f(x)=${powerOfX(power)}e^{${variableTerm(-k, "x", true)}}$ とする。$f'(1)$ を求めよ。`,
      answer: `${power - k}/e^${k}`,
    };
  }),
  ...makeTemplates("diff-quotient", [1, 2, 3, 4, 5], (a, rng) => {
    const b = signedInteger(rng, 1, 6);
    const c = integer(rng, 1, 5);
    const d = integer(rng, 2, 8);
    return {
      prompt: `$f(x)=\\dfrac{${variableTerm(a, "x", true)}${constantTerm(b)}}{${variableTerm(c, "x", true)}+${d}}$ とする。$f'(0)$ を求めよ。`,
      answer: fraction(a * d - b * c, d ** 2),
    };
  }),
];

const TAYLOR_EXTREMA = [
  ...makeTemplates("taylor-exp", [1, 2, 3, 4, 5], (degree, rng) => {
    const k = integer(rng, 1, 4);
    return {
      prompt: `$e^{${variableTerm(k, "x", true)}}$ のマクローリン展開における $${powerOfX(degree)}$ の係数を求めよ。`,
      answer: fraction(k ** degree, factorial(degree)),
    };
  }, "taylor-coefficient"),
  ...makeTemplates("taylor-sine", [0, 1, 2, 3, 4], (order, rng) => {
    const degree = 2 * order + 1;
    const k = integer(rng, 1, 4);
    return {
      prompt: `$\\sin(${variableTerm(k, "x", true)})$ のマクローリン展開における $${powerOfX(degree)}$ の係数を求めよ。`,
      answer: fraction((order % 2 ? -1 : 1) * k ** degree, factorial(degree)),
    };
  }, "taylor-coefficient"),
  ...makeTemplates("taylor-cosine", [1, 2, 3, 4, 5], (order, rng) => {
    const degree = 2 * order;
    const k = integer(rng, 1, 4);
    return {
      prompt: `$\\cos(${variableTerm(k, "x", true)})$ のマクローリン展開における $${powerOfX(degree)}$ の係数を求めよ。`,
      answer: fraction((order % 2 ? -1 : 1) * k ** degree, factorial(degree)),
    };
  }, "taylor-coefficient"),
  ...makeTemplates("taylor-log", [1, 2, 3, 4, 5], (degree, rng) => {
    const k = integer(rng, 1, 5);
    return {
      prompt: `$\\log(1${variableTerm(k, "x")})$ のマクローリン展開における $${powerOfX(degree)}$ の係数を求めよ。`,
      answer: fraction((degree % 2 ? 1 : -1) * k ** degree, degree),
    };
  }, "taylor-coefficient"),
  ...makeTemplates("critical-parameter", [1, 2, 3, 4, 5], (kind, rng) => {
    const point = integer(rng, 1, 4);
    if (kind === 1) return {
      prompt: `$f(x)=x^4+px^2$ とする。$x=${point}$ が停留点となるように $p$ を定めよ。`,
      answer: -2 * point ** 2,
    };
    if (kind === 2) return {
      prompt: `$f(x)=x^3+px$ とする。$x=${point}$ が停留点となるように $p$ を定めよ。`,
      answer: -3 * point ** 2,
    };
    if (kind === 3) return {
      prompt: `$f(x)=e^x+px$ とする。$x=${point}$ が停留点となるように $p$ を定めよ。`,
      answer: `-e^${point}`,
    };
    if (kind === 4) return {
      prompt: `$f(x)=\\log(1+x)+px^2$ とする。$x=${point}$ が停留点となるように $p$ を定めよ。`,
      answer: fraction(-1, 2 * point * (point + 1)),
    };
    return {
      prompt: "$f(x)=\\sin x+px$ とする。$x=\\pi$ が停留点となるように $p$ を定めよ。",
      answer: 1,
    };
  }),
  ...makeTemplates("taylor-exp-cos", [2, 3, 4, 5, 6], (degree, rng) => {
    const a = integer(rng, 1, 4);
    let b = integer(rng, 1, 4);
    let numerator = exponentialCosineNumerator(degree, a, b);
    if (numerator === 0) {
      b = b === 4 ? 1 : b + 1;
      numerator = exponentialCosineNumerator(degree, a, b);
    }
    return {
      prompt: `$e^{${variableTerm(a, "x", true)}}\\cos(${variableTerm(b, "x", true)})$ のマクローリン展開における $${powerOfX(degree)}$ の係数を求めよ。`,
      answer: fraction(numerator, factorial(degree)),
    };
  }, "taylor-coefficient"),
  ...makeTemplates("taylor-limit", [1, 2, 3, 4, 5], (kind, rng) => {
    const k = integer(rng, 1, 5);
    if (kind === 1) return {
      prompt: `$\\displaystyle\\lim_{x\\to0}\\frac{e^{${variableTerm(k, "x", true)}}-1-${variableTerm(k, "x", true)}}{x^2}$ を求めよ。`,
      answer: fraction(k ** 2, 2),
    };
    if (kind === 2) return {
      prompt: `$\\displaystyle\\lim_{x\\to0}\\frac{\\sin(${variableTerm(k, "x", true)})-${variableTerm(k, "x", true)}}{x^3}$ を求めよ。`,
      answer: fraction(-(k ** 3), 6),
    };
    if (kind === 3) return {
      prompt: `$\\displaystyle\\lim_{x\\to0}\\frac{\\cos(${variableTerm(k, "x", true)})-1+\\frac{${k ** 2}}{2}x^2}{x^4}$ を求めよ。`,
      answer: fraction(k ** 4, 24),
    };
    if (kind === 4) return {
      prompt: `$\\displaystyle\\lim_{x\\to0}\\frac{\\log(1${variableTerm(k, "x")})-${variableTerm(k, "x", true)}}{x^2}$ を求めよ。`,
      answer: fraction(-(k ** 2), 2),
    };
    return {
      prompt: `$\\displaystyle\\lim_{x\\to0}\\frac{e^{${variableTerm(k, "x", true)}}-1-${variableTerm(k, "x", true)}-\\frac{${k ** 2}}{2}x^2}{x^3}$ を求めよ。`,
      answer: fraction(k ** 3, 6),
    };
  }),
  ...makeTemplates("taylor-approximation", [1, 2, 3, 4, 5], (kind, rng) => {
    const k = integer(rng, 1, 3);
    const m = integer(rng, 4, 8);
    if (kind === 1) return {
      prompt: `$e^{${variableTerm(k, "x", true)}}$ の2次マクローリン多項式を $T_2(x)$ とする。$T_2(1/${m})$ を求めよ。`,
      answer: fraction(2 * m ** 2 + 2 * k * m + k ** 2, 2 * m ** 2),
    };
    if (kind === 2) return {
      prompt: `$\\sin(${variableTerm(k, "x", true)})$ の3次マクローリン多項式を $T_3(x)$ とする。$T_3(1/${m})$ を求めよ。`,
      answer: fraction(6 * k * m ** 2 - k ** 3, 6 * m ** 3),
    };
    if (kind === 3) return {
      prompt: `$\\cos(${variableTerm(k, "x", true)})$ の2次マクローリン多項式を $T_2(x)$ とする。$T_2(1/${m})$ を求めよ。`,
      answer: fraction(2 * m ** 2 - k ** 2, 2 * m ** 2),
    };
    if (kind === 4) return {
      prompt: `$\\log(1${variableTerm(k, "x")})$ の2次マクローリン多項式を $T_2(x)$ とする。$T_2(1/${m})$ を求めよ。`,
      answer: fraction(2 * k * m - k ** 2, 2 * m ** 2),
    };
    return {
      prompt: `$\\sqrt{1${variableTerm(k, "x")}}$ の2次マクローリン多項式を $T_2(x)$ とする。$T_2(1/${m})$ を求めよ。`,
      answer: fraction(8 * m ** 2 + 4 * k * m - k ** 2, 8 * m ** 2),
    };
  }),
  ...makeTemplates("taylor-leading-order", [1, 2, 3, 4, 5], (kind, rng) => {
    const k = integer(rng, 1, 5);
    const expressions = [
      `e^{${variableTerm(k, "x", true)}}-1`,
      `\\sin(${variableTerm(k, "x", true)})-${variableTerm(k, "x", true)}`,
      `\\cos(${variableTerm(k, "x", true)})-1`,
      `e^{${variableTerm(k, "x", true)}}-1-${variableTerm(k, "x", true)}`,
      `\\log(1${variableTerm(k, "x")})-${variableTerm(k, "x", true)}+\\frac{${k ** 2}}{2}x^2`,
    ];
    const orders = [1, 3, 2, 2, 3];
    return {
      prompt: `$\\displaystyle\\lim_{x\\to0}\\frac{${expressions[kind - 1]}}{x^n}$ が0でない有限値となる最小の正整数 $n$ を求めよ。`,
      answer: orders[kind - 1],
    };
  }),
];

const PARTIALS = [
  ...makeTemplates("partial-x", [2, 3, 4, 5, 6], (degree, rng) => {
    const a = integer(rng, 1, 4);
    const b = signedInteger(rng, 1, 6);
    const x = signedInteger(rng, 1, 2);
    const y = signedInteger(rng, 1, 3);
    return {
      prompt: `$f(x,y)=${variableTerm(a, `x^${degree}`, true)}${variableTerm(b, "xy")}+y^2$ とする。$f_x(${x},${y})$ を求めよ。`,
      answer: a * degree * x ** (degree - 1) + b * y,
    };
  }),
  ...makeTemplates("partial-y", [2, 3, 4, 5, 6], (degree, rng) => {
    const b = signedInteger(rng, 1, 6);
    const c = integer(rng, 1, 4);
    const x = signedInteger(rng, 1, 3);
    const y = signedInteger(rng, 1, 2);
    return {
      prompt: `$f(x,y)=x^2${variableTerm(b, "xy")}${variableTerm(c, `y^${degree}`)}$ とする。$f_y(${x},${y})$ を求めよ。`,
      answer: b * x + c * degree * y ** (degree - 1),
    };
  }),
  ...makeTemplates("partial-mixed", [1, 2, 3, 4, 5], (magnitude, rng) => {
    const b = rng() < 0.5 ? -magnitude : magnitude;
    return {
      prompt: `$f(x,y)=x^3${variableTerm(b, "xy")}+y^3$ とする。$f_{xy}(0,0)$ を求めよ。`,
      answer: b,
    };
  }),
  ...makeTemplates("partial-exponential", [1, 2, 3, 4, 5], (a, rng) => {
    const b = signedInteger(rng, 1, 5);
    return {
      prompt: `$f(x,y)=e^{${variableTerm(a, "x", true)}${variableTerm(b, "y")}}$ とする。$f_{xy}(0,0)$ を求めよ。`,
      answer: a * b,
    };
  }),
  ...makeTemplates("partial-sine", [1, 2, 3, 4, 5], (a, rng) => {
    const b = signedInteger(rng, 1, 6);
    return {
      prompt: `$f(x,y)=\\sin(${variableTerm(a, "x", true)}${variableTerm(b, "y")})$ とする。$f_x(0,0)$ を求めよ。`,
      answer: a,
    };
  }),
  ...makeTemplates("partial-cosine", [1, 2, 3, 4, 5], (a, rng) => {
    const b = signedInteger(rng, 1, 6);
    return {
      prompt: `$f(x,y)=\\cos(${variableTerm(a, "x", true)}${variableTerm(b, "y")})$ とする。$f_{xy}(0,0)$ を求めよ。`,
      answer: -a * b,
    };
  }),
  ...makeTemplates("partial-quotient", [1, 2, 3, 4, 5], (coefficient, rng) => {
    const point = integer(rng, 2, 7);
    return {
      prompt: `$f(x,y)=\\dfrac{x${variableTerm(coefficient, "y")}}{x-y}$ とする。$f_x(${point},1)$ を求めよ。`,
      answer: fraction(-(coefficient + 1), (point - 1) ** 2),
    };
  }),
];

const INTEGRALS = [
  ...makeTemplates("primitive-power", [1, 2, 3, 4, 5, 6, 7], (degree) => ({
    prompt: `$F'(x)=${powerOfX(degree)},\\ F(0)=0$ とする。$F(1)$ を求めよ。`,
    answer: fraction(1, degree + 1),
  })),
  ...makeTemplates("primitive-polynomial", [1, 2, 3, 4, 5], (degree, rng) => {
    const a = signedInteger(rng, 1, 8);
    const b = signedInteger(rng, 1, 8);
    return {
      prompt: `$F'(x)=${variableTerm(a, powerOfX(degree), true)}${constantTerm(b)},\\ F(0)=0$ とする。$F(1)$ を求めよ。`,
      answer: fraction(a + b * (degree + 1), degree + 1),
    };
  }),
  ...makeTemplates("integral-power", [1, 2, 3, 4, 5], (degree, rng) => {
    const endpoint = integer(rng, 1, 4);
    return {
      prompt: `$\\displaystyle \\int_0^{${endpoint}}${powerOfX(degree)}\\,dx$ を求めよ。`,
      answer: fraction(endpoint ** (degree + 1), degree + 1),
    };
  }),
  ...makeTemplates("integral-sine", [1, 2, 3, 4, 5], (k) => ({
    prompt: `$\\displaystyle \\int_0^{${piOver(k)}}\\sin(${variableTerm(k, "x", true)})\\,dx$ を求めよ。`,
    answer: fraction(2, k),
  })),
  ...makeTemplates("integral-cosine", [1, 2, 3, 4, 5], (k) => ({
    prompt: `$\\displaystyle \\int_0^{${piOver(2 * k)}}\\cos(${variableTerm(k, "x", true)})\\,dx$ を求めよ。`,
    answer: fraction(1, k),
  })),
  ...makeTemplates("integral-improper", [2, 3, 4, 5, 6], (power) => ({
    prompt: `$\\displaystyle \\int_1^{\\infty}\\frac{1}{x^${power}}\\,dx$ を求めよ。`,
    answer: fraction(1, power - 1),
  })),
  ...makeTemplates("integral-polynomial", [1, 2, 3, 4, 5], (degree, rng) => {
    const a = signedInteger(rng, 1, 8);
    const b = signedInteger(rng, 1, 8);
    return {
      prompt: `$\\displaystyle \\int_0^1(${variableTerm(a, powerOfX(degree), true)}${constantTerm(b)})\\,dx$ を求めよ。`,
      answer: fraction(a + b * (degree + 1), degree + 1),
    };
  }),
  ...makeTemplates("integral-exponential", [1, 2, 3, 4, 5], (k) => ({
    prompt: `$\\displaystyle \\int_0^1e^{${variableTerm(k, "x", true)}}\\,dx$ を求めよ。`,
    answer: k === 1 ? "e-1" : `(e^${k}-1)/${k}`,
  })),
];

const DOUBLE_INTEGRALS = [
  ...makeTemplates("double-linear", [1, 2, 3, 4, 5], (a, rng) => {
    const b = signedInteger(rng, 1, 5);
    const m = integer(rng, 1, 4);
    const n = integer(rng, 1, 4);
    return {
      prompt: `$\\displaystyle \\int_0^{${m}}\\int_0^{${n}}(${variableTerm(a, "x", true)}${variableTerm(b, "y")})\\,dy\\,dx$ を求めよ。`,
      answer: fraction(m * n * (a * m + b * n), 2),
    };
  }),
  ...makeTemplates("double-product", [1, 2, 3, 4, 5], (m, rng) => {
    const n = integer(rng, 1, 5);
    return {
      prompt: `$\\displaystyle \\int_0^{${m}}\\int_0^{${n}}xy\\,dy\\,dx$ を求めよ。`,
      answer: fraction(m ** 2 * n ** 2, 4),
    };
  }),
  ...makeTemplates("double-unit-square", [1, 2, 3, 4, 5], (p, rng) => {
    const q = integer(rng, 1, 5);
    return {
      prompt: `$\\displaystyle \\int_0^1\\int_0^1${variablePower("x", p)}${variablePower("y", q)}\\,dy\\,dx$ を求めよ。`,
      answer: fraction(1, (p + 1) * (q + 1)),
    };
  }),
  ...makeTemplates("double-triangle-area", [2, 3, 4, 5, 6], (endpoint) => ({
    prompt: `$D=\\{(x,y)\\mid0\\le y\\le x\\le ${endpoint}\\}$ とする。$\\displaystyle \\iint_D 1\\,dx\\,dy$ を求めよ。`,
    answer: fraction(endpoint ** 2, 2),
  })),
  ...makeTemplates("double-triangle-x", [1, 2, 3, 4, 5], (power, rng) => {
    const endpoint = integer(rng, 1, 5);
    return {
      prompt: `$\\displaystyle \\int_0^{${endpoint}}\\int_0^x ${variablePower("x", power)}\\,dy\\,dx$ を求めよ。`,
      answer: fraction(endpoint ** (power + 2), power + 2),
    };
  }),
  ...makeTemplates("double-triangle-y", [1, 2, 3, 4, 5], (power, rng) => {
    const endpoint = integer(rng, 1, 5);
    return {
      prompt: `$\\displaystyle \\int_0^{${endpoint}}\\int_0^x ${variablePower("y", power)}\\,dy\\,dx$ を求めよ。`,
      answer: fraction(endpoint ** (power + 2), (power + 1) * (power + 2)),
    };
  }),
  ...makeTemplates("double-disk", [1, 2, 3, 4, 5], (radius) => ({
    prompt: `$D=\\{(x,y)\\mid x^2+y^2\\le ${radius ** 2}\\}$ とする。$\\displaystyle \\iint_D 1\\,dx\\,dy$ を求めよ。`,
    answer: `${radius ** 2}*pi`,
  })),
];

const BASE_TOPICS = [
  { id: "limits", label: "極限", count: 5, generators: LIMITS },
  { id: "differentiation", label: "1変数関数の微分", count: 5, generators: DIFFERENTIATION },
  { id: "taylor-extrema", label: "テイラー展開と極値", count: 5, generators: TAYLOR_EXTREMA },
  { id: "partials", label: "偏微分", count: 5, generators: PARTIALS },
  { id: "integrals", label: "原始関数・積分", count: 5, generators: INTEGRALS },
  { id: "double-integrals", label: "重積分", count: 5, generators: DOUBLE_INTEGRALS },
];

const TOPICS = Object.freeze([
  { id: "comprehensive", label: "総合演習", count: 10 },
  ...BASE_TOPICS,
]);

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function generatorFamilies(topic) {
  const families = new Map();
  topic.generators.forEach((generate) => {
    const family = generate.templateFamily || "other";
    if (!families.has(family)) families.set(family, []);
    families.get(family).push(generate);
  });
  return families;
}

function selectVariedGenerators(topic, count, rng) {
  const selected = shuffled([...generatorFamilies(topic).values()], rng)
    .slice(0, count)
    .map((family) => shuffled(family, rng)[0]);
  if (selected.length >= count) return selected;
  const selectedSet = new Set(selected);
  const remaining = shuffled(topic.generators.filter((generate) => !selectedSet.has(generate)), rng);
  return [...selected, ...remaining.slice(0, count - selected.length)];
}

function generateFromTopic(topic, count, rng) {
  return selectVariedGenerators(topic, Math.min(count, topic.generators.length), rng)
    .map((generate) => ({ section: topic.label, ...generate(rng) }));
}

function generateComprehensive(rng) {
  const selected = [];
  const usedIds = new Set();

  shuffled(BASE_TOPICS, rng).forEach((topic) => {
    const question = generateFromTopic(topic, 1, rng)[0];
    selected.push(question);
    usedIds.add(`${topic.id}:${question.templateFamily}`);
  });

  const remainingPool = shuffled(
    BASE_TOPICS.flatMap((topic) => [...generatorFamilies(topic)].map(([family, generators]) => ({
      topic,
      family,
      generators,
    }))),
    rng,
  );
  for (const candidate of remainingPool) {
    if (selected.length >= 10) break;
    const key = `${candidate.topic.id}:${candidate.family}`;
    if (usedIds.has(key)) continue;
    const generate = shuffled(candidate.generators, rng)[0];
    const question = { section: candidate.topic.label, ...generate(rng) };
    selected.push(question);
    usedIds.add(key);
  }
  return shuffled(selected, rng);
}

function createExerciseSet(topicId, count, rng = Math.random) {
  const topic = TOPICS.find((candidate) => candidate.id === topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);
  const requestedCount = count ?? topic.count;
  const questions = topicId === "comprehensive"
    ? generateComprehensive(rng).slice(0, requestedCount)
    : generateFromTopic(topic, requestedCount, rng);
  return questions.map((question, index) => ({ number: index + 1, ...question }));
}

globalThis.CalculusGenerators = { TOPICS, createExerciseSet };
