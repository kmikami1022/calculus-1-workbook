(function () {
  const { STATUS, gradeSubmission } = globalThis.CalculusJudge;
  const { TOPICS, createExerciseSet } = globalThis.CalculusGenerators;
  const { createQuestionCard, renderResults } = globalThis.CalculusUI;

  const topicSelect = document.querySelector("#topic-select");
  const generatedList = document.querySelector("#generated-list");
  const generatedTopic = document.querySelector("#generated-topic");
  const submission = document.querySelector("#practice-submission");
  const resultsPanel = document.querySelector("#practice-results");
  let questions = [];

  TOPICS.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic.id;
    option.textContent = topic.label;
    topicSelect.append(option);
  });

  function selectedTopic() {
    return TOPICS.find((candidate) => candidate.id === topicSelect.value);
  }

  function updateControls() {
    const topic = selectedTopic();
    document.querySelector("#generate-button").textContent = `${topic.count}問に挑戦する`;
    submission.rows = topic.count === 10 ? 14 : 10;
    submission.placeholder = Array.from({ length: topic.count }, (_, index) => `${index + 1} 回答`).join("\n");
  }

  function generatePractice() {
    const topic = selectedTopic();
    questions = createExerciseSet(topic.id);
    const fragment = document.createDocumentFragment();
    const showSections = topic.id === "comprehensive";
    questions.forEach((question) => fragment.append(createQuestionCard(question, "generated-q", showSections)));
    generatedList.replaceChildren(fragment);
    generatedTopic.textContent = `${topic.label}・${questions.length}問`;
    submission.value = "";
    resultsPanel.hidden = true;
  }

  topicSelect.addEventListener("change", updateControls);
  document.querySelector("#generate-button").addEventListener("click", generatePractice);

  document.querySelector("#practice-judge-button").addEventListener("click", () => {
    const graded = gradeSubmission(submission.value, questions);
    document.querySelector("#practice-score").textContent = `${questions.length}問中 ${graded.summary[STATUS.AC]}問正解`;
    renderResults(
      graded,
      {
        panel: resultsPanel,
        summary: document.querySelector("#practice-summary"),
        lineErrors: document.querySelector("#practice-line-errors"),
        body: document.querySelector("#practice-result-body"),
      },
      "generated-q",
    );
  });

  document.querySelector("#practice-clear-button").addEventListener("click", () => {
    submission.value = "";
    resultsPanel.hidden = true;
    submission.focus();
  });

  updateControls();
  generatePractice();
})();
