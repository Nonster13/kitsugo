(() => {
  const data = window.KITSUGO_DATA;
  const $ = (id) => document.getElementById(id);
  const saved = JSON.parse(localStorage.getItem("kitsugo-progress") || '{"xp":0,"knownWords":[],"studiedKanji":[],"quizzes":0,"streak":1,"mistakes":[]}');
  const persist = () => localStorage.setItem("kitsugo-progress", JSON.stringify(saved));

  function showPage(name) {
    document.querySelectorAll(".page").forEach(p => p.classList.toggle("active-page", p.id === `page-${name}`));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === name));
    $("currentSection").textContent = ({dashboard:"Dashboard",vocabulary:"Vocabulary",kanji:"Kanji dojo",grammar:"Grammar lab",reading:"Reading practice",exams:"JLPT exams",review:"Review mistakes"})[name] || "Dashboard";
    $("sidebar").classList.remove("open");
    if (name === "review") renderReview();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  document.addEventListener("click", e => {
    const target = e.target.closest("[data-page]");
    if (target) { e.preventDefault(); showPage(target.dataset.page); }
  });
  $("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("todayDate").textContent = new Intl.DateTimeFormat("en", {weekday:"short",month:"short",day:"numeric"}).format(new Date());
  $("streakCount").textContent = saved.streak;

  function renderStats() {
    $("xpValue").textContent = saved.xp;
    $("wordsValue").textContent = saved.knownWords.length;
    $("kanjiValue").textContent = saved.studiedKanji.length;
    $("quizValue").textContent = saved.quizzes;
    $("knownWords").textContent = saved.knownWords.length;
    const progress = Math.min(100, Math.round((saved.knownWords.length + saved.studiedKanji.length) / 40 * 100));
    $("pathProgress").style.width = progress + "%";
    document.querySelector(".path-percent").textContent = progress + "%";
  }

  let vocabIndex = 0;
  function renderVocab() {
    const item = data.vocabulary[vocabIndex];
    $("vocabWord").textContent = item.word;
    $("vocabReading").textContent = `${item.reading} · ${item.romaji}`;
    $("vocabMeaning").textContent = item.meaning;
    $("vocabExample").textContent = item.example;
    $("vocabExampleTranslation").textContent = item.translation;
    $("vocabPosition").textContent = `${vocabIndex + 1} / ${data.vocabulary.length}`;
  }
  function nextVocab(known) {
    const word = data.vocabulary[vocabIndex].word;
    if (known && !saved.knownWords.includes(word)) { saved.knownWords.push(word); saved.xp += 10; persist(); renderStats(); }
    vocabIndex = (vocabIndex + 1) % data.vocabulary.length;
    renderVocab();
  }
  $("vocabKnow").addEventListener("click", () => nextVocab(true));
  $("vocabAgain").addEventListener("click", () => nextVocab(false));

  $("kanjiGrid").innerHTML = data.kanji.map(k => `<article class="panel kanji-card"><span class="mini-badge">N5 STARTER</span><div class="kanji-large">${k.character}</div><div class="kanji-reading">ON: ${k.on}<br>KUN: ${k.kun}</div><div class="kanji-meaning">${k.meaning}</div><div class="kanji-example">${k.example}</div><button class="text-button kanji-study" data-kanji="${k.character}">Mark studied →</button></article>`).join("");
  $("kanjiGrid").addEventListener("click", e => {
    const btn = e.target.closest("[data-kanji]");
    if (!btn) return;
    const character = btn.dataset.kanji;
    if (!saved.studiedKanji.includes(character)) { saved.studiedKanji.push(character); saved.xp += 5; persist(); renderStats(); }
    btn.textContent = "Studied ✓";
    btn.disabled = true;
  });

  function wireQuickCheck(containerId, feedbackId, answer, correctText, wrongText) {
    $(containerId).addEventListener("click", e => {
      const btn = e.target.closest("[data-answer]");
      if (!btn) return;
      $(containerId).querySelectorAll("button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      const correct = btn.dataset.answer === answer;
      $(feedbackId).textContent = correct ? correctText : wrongText;
      $(feedbackId).style.color = correct ? "#4eaa85" : "#c77979";
      if (correct) { saved.xp += 5; persist(); renderStats(); }
      else addMistake("Quick practice", btn.dataset.answer);
    });
  }
  wireQuickCheck("grammarChoices","grammarFeedback","は","Correct. は marks the topic of the sentence.","Not quite. This sentence introduces the topic with は.");
  wireQuickCheck("readingChoices","readingFeedback","七時","Correct. 七時 means seven o'clock.","Try checking the first sentence: 毎日七時に起きます.");

  let examIndex = 0, examScore = 0, examAnswered = false;
  function renderExam() {
    const q = data.exam[examIndex];
    $("examTitle").textContent = `Question ${examIndex + 1} of ${data.exam.length}`;
    $("examProgress").style.width = `${(examIndex + 1) / data.exam.length * 100}%`;
    $("examQuestion").textContent = q.q;
    $("examScore").textContent = `Score: ${examScore}`;
    $("examFeedback").textContent = "";
    $("examNext").disabled = true;
    $("examNext").textContent = examIndex === data.exam.length - 1 ? "See results →" : "Next question →";
    examAnswered = false;
    $("examOptions").innerHTML = q.options.map((option,i) => `<button class="exam-option" data-option="${i}">${String.fromCharCode(65+i)}. ${option}</button>`).join("");
  }
  $("examOptions").addEventListener("click", e => {
    const btn = e.target.closest("[data-option]");
    if (!btn || examAnswered) return;
    examAnswered = true;
    const q = data.exam[examIndex], selected = Number(btn.dataset.option), correct = selected === q.answer;
    if (correct) { examScore++; saved.xp += 10; }
    else addMistake(q.q, q.options[selected]);
    $("examOptions").querySelectorAll("button").forEach((b,i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      else if (i === selected) b.classList.add("wrong");
    });
    $("examFeedback").textContent = (correct ? "Correct! " : "Not quite. ") + q.explain;
    $("examFeedback").style.color = correct ? "#4eaa85" : "#c77979";
    $("examNext").disabled = false;
    persist(); renderStats();
  });
  $("examNext").addEventListener("click", () => {
    if (!examAnswered) return;
    if (examIndex < data.exam.length - 1) { examIndex++; renderExam(); }
    else {
      saved.quizzes++; persist(); renderStats();
      $("examTitle").textContent = "Mini mock complete";
      $("examQuestion").textContent = `You scored ${examScore} out of ${data.exam.length}.`;
      $("examOptions").innerHTML = `<p class="subtitle">Keep practicing and review anything that felt difficult.</p>`;
      $("examFeedback").textContent = `You earned ${examScore * 10} XP from correct answers.`;
      $("examNext").textContent = "Try again →"; $("examNext").disabled = false;
      $("examNext").onclick = () => { examIndex=0; examScore=0; $("examNext").onclick=null; renderExam(); };
    }
  });

  function addMistake(question, answer) {
    saved.mistakes.unshift({question,answer});
    saved.mistakes = saved.mistakes.slice(0,20);
    persist();
  }
  function renderReview() {
    if (!saved.mistakes.length) {
      $("reviewTitle").textContent = "Your review list is clear.";
      $("reviewText").textContent = "When you miss a practice question, it will appear here so you can revisit it.";
      return;
    }
    $("reviewTitle").textContent = `${saved.mistakes.length} item${saved.mistakes.length===1?"":"s"} to revisit`;
    $("reviewText").innerHTML = saved.mistakes.map(m => `<div class="task-row"><div class="task-info"><strong>${m.question}</strong><small>Your answer: ${m.answer}</small></div></div>`).join("");
  }

  renderVocab(); renderExam(); renderStats();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
  }
})();
