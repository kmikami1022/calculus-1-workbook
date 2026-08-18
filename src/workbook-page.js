(function () {
  const questions = globalThis.CALCULUS_QUESTIONS || [];
  const { gradeSubmission } = globalThis.CalculusJudge;
  const { createQuestionCard, renderResults } = globalThis.CalculusUI;

  const problemList = document.querySelector("#problem-list");
  const questionCount = document.querySelector("#question-count");
  const submission = document.querySelector("#submission");
  const resultsPanel = document.querySelector("#results");

  function renderUnits() {
    const groups = new Map();
    questions.forEach((question) => {
      if (!groups.has(question.section)) groups.set(question.section, []);
      groups.get(question.section).push(question);
    });

    const fragment = document.createDocumentFragment();
    groups.forEach((items, section) => {
      const details = document.createElement("details");
      details.className = "unit-group";
      const summary = document.createElement("summary");
      summary.innerHTML = `<span>${section}</span><span class="unit-count">${items.length}問</span>`;
      const content = document.createElement("div");
      content.className = "unit-content";
      items.forEach((question) => content.append(createQuestionCard(question, "q")));
      details.append(summary, content);
      fragment.append(details);
    });
    problemList.replaceChildren(fragment);
    questionCount.textContent = `${questions.length}問・${groups.size}単元`;
  }

  document.querySelector("#judge-button").addEventListener("click", () => {
    renderResults(
      gradeSubmission(submission.value, questions),
      {
        panel: resultsPanel,
        summary: document.querySelector("#summary"),
        lineErrors: document.querySelector("#line-errors"),
        body: document.querySelector("#result-body"),
      },
      "q",
    );
  });

  document.querySelector("#clear-button").addEventListener("click", () => {
    submission.value = "";
    resultsPanel.hidden = true;
    submission.focus();
  });

  document.querySelector("#result-body").addEventListener("click", (event) => {
    const link = event.target.closest("[data-question-link]");
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href"));
    const group = target && target.closest("details");
    if (group) group.open = true;
  });

  if (questions.length) {
    renderUnits();
  } else {
    problemList.innerHTML = '<div class="load-error">問題データを読み込めませんでした。</div>';
    questionCount.textContent = "読込エラー";
    document.querySelector("#judge-button").disabled = true;
  }
})();
