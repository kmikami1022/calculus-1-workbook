(function () {
  const { STATUS } = globalThis.CalculusJudge;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function prepareMath(tex) {
    return tex.replace(/\\qty(?=[([{])/g, "");
  }

  function renderPrompt(prompt) {
    const fragments = String(prompt).split(/(\$[\s\S]*?\$)/g);
    return fragments
      .map((fragment) => {
        if (fragment.startsWith("$") && fragment.endsWith("$")) {
          const tex = prepareMath(fragment.slice(1, -1));
          if (globalThis.katex) {
            try {
              return globalThis.katex.renderToString(tex, { throwOnError: false, strict: "ignore" });
            } catch {
              return `<code>${escapeHtml(tex)}</code>`;
            }
          }
          return `<code>${escapeHtml(tex)}</code>`;
        }
        return escapeHtml(fragment)
          .replace(/\\begin\{itemize\}|\\end\{itemize\}/g, "")
          .replace(/\\item\s*/g, "<br>・")
          .replace(/\\\\/g, "<br>")
          .replace(/\n/g, " ");
      })
      .join("");
  }

  function createQuestionCard(question, idPrefix, showSection = false) {
    const article = document.createElement("article");
    article.className = "problem-card";
    article.id = `${idPrefix}-${question.number}`;
    article.innerHTML = `
      <div class="problem-number">${String(question.number).padStart(3, "0")}</div>
      <div class="problem-content">
        ${showSection ? `<span class="question-topic">${escapeHtml(question.section)}</span>` : ""}
        ${renderPrompt(question.prompt)}
      </div>
    `;
    return article;
  }

  function verdictBadge(status) {
    const className = status === STATUS.UNSUBMITTED ? "unsubmitted" : status.toLowerCase();
    return `<span class="verdict ${className}">${status}</span>`;
  }

  function renderResults(graded, elements, anchorPrefix) {
    const statuses = [STATUS.AC, STATUS.WA, STATUS.PE, STATUS.UNSUBMITTED];
    elements.summary.innerHTML = statuses
      .map((status) => `<div class="summary-item ${status === STATUS.UNSUBMITTED ? "unsubmitted" : status.toLowerCase()}">
        <span>${status}</span><strong>${graded.summary[status]}</strong>
      </div>`)
      .join("");

    elements.lineErrors.innerHTML = graded.lineErrors.length
      ? `<h3>入力形式エラー</h3><ul>${graded.lineErrors
          .map((error) => `<li>${error.line}行目：${escapeHtml(error.message)} <code>${escapeHtml(error.raw)}</code></li>`)
          .join("")}</ul>`
      : "";

    elements.body.innerHTML = graded.results
      .map((result) => `<tr class="result-${result.status === STATUS.UNSUBMITTED ? "unsubmitted" : result.status.toLowerCase()}">
        <td><a href="#${anchorPrefix}-${result.number}" data-question-link>${result.number}</a></td>
        <td>${verdictBadge(result.status)}${result.message ? `<small>${escapeHtml(result.message)}</small>` : ""}</td>
        <td>${escapeHtml(result.submitted || "—")}</td>
      </tr>`)
      .join("");

    elements.panel.hidden = false;
    elements.panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  globalThis.CalculusUI = { createQuestionCard, renderResults };
})();
