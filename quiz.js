document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration & State ---
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUaljShBvyyRznAZUEATmLmL9P60sjv7I3L9vahGRNl2ESnhRpGO85p7CrURm3rQ_KzA/exec";
  const QUIZ_DURATION_SECONDS = 60 * 60; // 60 minutes

  const quizState = {
    questions: [],
    answers: [],
    currentQuestionIndex: 0,
    tabSwitches: 0,
    timerId: null,
    isStarted: false,
    isSubmitted: false, // Prevent multiple submits
    studentName: localStorage.getItem("studentName"),
    rollNumber: localStorage.getItem("rollNumber")
  };

  // --- DOM Elements ---
  const studentNameEl = document.getElementById("studentName");
  const instructionsContainerEl = document.getElementById("instructionsContainer");
  const quizContainerEl = document.getElementById("quizContainer");
  const sidebarEl = document.getElementById("sidebar");
  const webcamContainerEl = document.getElementById("webcamContainer");
  const timerEl = document.getElementById("timer");
  const questionContainerEl = document.getElementById("questionContainer");
  const questionNavEl = document.getElementById("questionNav");
  const loaderEl = document.getElementById("loader");
  const quizFormEl = document.getElementById("quizForm");
  const controlsEl = document.querySelector(".controls");

  const startBtn = document.getElementById("startQuizBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  // --- Initialize ---
  function initialize() {
    if (!quizState.studentName || localStorage.getItem("role") !== "student") {
      window.location.href = "index.html";
      return;
    }
    studentNameEl.textContent = `Welcome, ${quizState.studentName}`;

    startBtn.addEventListener('click', startQuiz);
    prevBtn.addEventListener('click', showPrevQuestion);
    nextBtn.addEventListener('click', showNextQuestion);
    submitBtn.addEventListener('click', handleSubmit);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
  }

  // --- Toast Notifications ---
  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // --- Confirmation Modal ---
  function showConfirm(message, callback) {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    msg.textContent = message;
    modal.style.display = "flex";

    function close(result) {
      modal.style.display = "none";
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
      callback(result);
    }

    function onYes() { close(true); }
    function onNo() { close(false); }

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  }

  // --- Render Current Question ---
  function renderCurrentQuestion() {
    const q = quizState.questions[quizState.currentQuestionIndex];
    questionContainerEl.innerHTML = `
      <legend><h4>Q${quizState.currentQuestionIndex + 1}. ${q.text}</h4></legend>
      ${q.options.map((option, i) => `
        <label class="option" for="option${i}">
          <input type="radio" name="q${quizState.currentQuestionIndex}" id="option${i}" value="${i}" ${quizState.answers[quizState.currentQuestionIndex] === i ? "checked" : ""}>
          <span class="radio-custom"></span>
          ${option}
        </label>
      `).join("")}
    `;
    questionContainerEl.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', handleOptionSelect);
    });
    updateControls();
  }

  // --- Render Question Palette ---
  function renderNavigation() {
    questionNavEl.innerHTML = quizState.questions.map((_, i) => `
      <button 
        type="button" 
        class="nav-btn ${i === quizState.currentQuestionIndex ? "active" : ""} ${quizState.answers[i] != null ? "answered" : ""}" 
        onclick="navigateToQuestion(${i})">
        ${i + 1}
      </button>
    `).join("");
  }

  // --- Update Controls ---
  function updateControls() {
    prevBtn.style.display = quizState.currentQuestionIndex === 0 ? "none" : "inline-block";
    nextBtn.style.display = quizState.currentQuestionIndex === quizState.questions.length - 1 ? "none" : "inline-block";
    submitBtn.style.display = quizState.currentQuestionIndex === quizState.questions.length - 1 ? "inline-block" : "none";
  }

  // --- Timer ---
  function startTimer() {
    let timeLeft = QUIZ_DURATION_SECONDS;
    quizState.timerId = setInterval(() => {
      timeLeft--;
      const minutes = String(Math.floor(timeLeft / 60)).padStart(2,"0");
      const seconds = String(timeLeft % 60).padStart(2,"0");
      timerEl.textContent = `Time Left: ${minutes}:${seconds}`;
      if (timeLeft <= 0) {
        clearInterval(quizState.timerId);
        showToast("⏰ Time is up! Submitting your quiz...", "warning");
        handleSubmit();
      }
    }, 1000);
  }

  // --- Start Quiz ---
  async function startQuiz() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      document.getElementById("webcam").srcObject = stream;
      webcamContainerEl.style.display = "block";
    } catch (err) {
      showToast("Webcam access is required to start the quiz.", "error");
      return;
    }

    quizState.isStarted = true;
    instructionsContainerEl.style.display = "none";
    quizContainerEl.style.display = "block";
    sidebarEl.style.display = "flex";
    document.documentElement.requestFullscreen?.().catch(err => console.warn(err));

    loaderEl.style.display = "block";
    quizFormEl.style.display = "none";
    controlsEl.style.display = "none";

    try {
      const res = await fetch(SCRIPT_URL);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      quizState.questions = await res.json();
      quizState.answers = new Array(quizState.questions.length).fill(null);

      renderCurrentQuestion();
      renderNavigation();
      startTimer();
    } catch (error) {
      loaderEl.innerHTML = `
        <p>Failed to load questions.</p>
        <button class="btn btn-primary" id="retryBtn">Retry</button>
      `;
      document.getElementById("retryBtn").addEventListener("click", () => location.reload());
      console.error(error);
    } finally {
      loaderEl.style.display = "none";
      quizFormEl.style.display = "block";
      controlsEl.style.display = "flex";
    }
  }

  // --- Option Selection ---
  function handleOptionSelect(event) {
    quizState.answers[quizState.currentQuestionIndex] = parseInt(event.target.value);
    renderNavigation();
  }

  // --- Navigation ---
  function showNextQuestion() {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      quizState.currentQuestionIndex++;
      renderCurrentQuestion();
      renderNavigation();
    }
  }

  function showPrevQuestion() {
    if (quizState.currentQuestionIndex > 0) {
      quizState.currentQuestionIndex--;
      renderCurrentQuestion();
      renderNavigation();
    }
  }

  window.navigateToQuestion = (index) => {
    quizState.currentQuestionIndex = index;
    renderCurrentQuestion();
    renderNavigation();
  };

  // --- Logout ---
  window.handleLogout = () => {
    if (quizState.isStarted) {
      showConfirm("Your quiz is in progress. Logout will lose progress.", (confirmed) => {
        if (!confirmed) return;
        localStorage.clear();
        window.location.href = "index.html";
      });
    } else {
      localStorage.clear();
      window.location.href = "index.html";
    }
  };

  // --- Submit Quiz ---
  async function handleSubmit() {
    if (quizState.isSubmitted) return; // prevent duplicate submission
    quizState.isSubmitted = true;

    showConfirm("Are you sure you want to submit the quiz?", async (confirmed) => {
      if (!confirmed) {
        quizState.isSubmitted = false; // allow retry
        return;
      }

      clearInterval(quizState.timerId);
      quizState.isStarted = false;

      const payload = {
        name: quizState.studentName,
        rollNumber: quizState.rollNumber,
        tabSwitches: quizState.tabSwitches,
        answers: quizState.answers.map(a => a !== null ? ["A","B","C","D"][a] : "Not Answered")
      };

      try {
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;

        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        showToast("✅ Quiz submitted successfully!", "success");
        localStorage.clear();
        window.location.href = "thankyou.html";

      } catch (error) {
        showToast("⚠️ Submission failed. Check your connection.", "error");
        submitBtn.textContent = "Submit Quiz";
        submitBtn.disabled = false;
        quizState.isSubmitted = false; // allow retry
        console.error(error);
      }
    });
  }

  // --- Tab switch detection ---
function handleVisibilityChange() {
  if (document.hidden && quizState.isStarted && !quizState.isSubmitted) {
    quizState.tabSwitches++;
    // Update the tab switch count in header
    const tabSwitchEl = document.getElementById("tabSwitchCount");
    if (tabSwitchEl) {
      tabSwitchEl.textContent = `Tab Switches: ${quizState.tabSwitches}`;
    }
  }
}


  // --- Prevent accidental leave ---
  function handleBeforeUnload(e) {
    if (quizState.isStarted && !quizState.isSubmitted) {
      e.preventDefault();
      e.returnValue = "Leaving will lose progress.";
    }
  }

  // --- Initialize ---
  initialize();
});
