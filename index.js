let quizStartTime, quizEndTime;
let users = [];
const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");
const countdownLabel = document.getElementById("countdownLabel");
const countdownTimer = document.getElementById("countdownTimer");
const toast = document.getElementById("toast");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
let toastShown = false;

// ✅ Load quiz times from Google Apps Script
async function loadQuizTimes() {
  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbwreU-Lr-VKRkJFrzGxJv7Gn6lA7ECduVeujnWCwvR5S1ROFfE879XQmtEUuKmLbyGT/exec");
    if (!res.ok) throw new Error("Failed to fetch quiz times");
    const data = await res.json();

    // Convert UTC → Local time
    quizStartTime = new Date(data.QuizStartTime);
    quizEndTime = new Date(data.QuizEndTime);

    quizStartTime = new Date(quizStartTime.getTime() + (quizStartTime.getTimezoneOffset() * -60000));
    quizEndTime = new Date(quizEndTime.getTime() + (quizEndTime.getTimezoneOffset() * -60000));

    console.log("Quiz Start:", quizStartTime);
    console.log("Quiz End:", quizEndTime);
  } catch (err) {
    console.error("Error loading quiz times:", err);
    alert("Could not load quiz timings. Please try again later.");
  }
}

// ✅ Load student data
async function loadStudents() {
  try {
    const res = await fetch("students.json");
    if (!res.ok) throw new Error("Failed to load student data");
    users = await res.json();
  } catch (err) {
    console.error(err);
    alert("Error loading student data. Please try again later.");
  }
}

// ✅ Countdown timer
function updateCountdown() {
  if (!quizStartTime || !quizEndTime) return; // Wait until times are loaded

  const now = new Date();
  let timeLeft;

  if (now < quizStartTime) {
    timeLeft = quizStartTime - now;
    countdownLabel.textContent = "Time until quiz starts:";
    loginBtn.disabled = true;
    loginBtn.textContent = "Login (Locked)";
    countdownTimer.classList.remove("blink");
  } else if (now >= quizStartTime && now <= quizEndTime) {
    timeLeft = quizEndTime - now;
    countdownLabel.textContent = "Time remaining in quiz:";
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
    countdownTimer.classList.add("blink");

    if (!toastShown) {
      showToast("Quiz is now live!");
      toastShown = true;
    }
  } else {
    countdownLabel.textContent = "Quiz has ended.";
    countdownTimer.textContent = "00:00:00";
    loginBtn.disabled = true;
    loginBtn.textContent = "Login (Closed)";
    countdownTimer.classList.remove("blink");
    clearInterval(timerId);
    return;
  }

  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  countdownTimer.textContent =
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

// ✅ Validate login
function validateLogin(e) {
  e.preventDefault();
  const now = new Date();
  errorMsg.textContent = "";

  if (now < quizStartTime || now > quizEndTime) {
    errorMsg.textContent = "The login window for the quiz is closed.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem("studentName", user.name);
    localStorage.setItem("rollNumber", user.username);
    localStorage.setItem("role", user.role);
    window.location.href = "quiz.html";
  } else {
    errorMsg.textContent = "Invalid credentials. Try again.";
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

// ✅ Initialize
async function init() {
  await loadQuizTimes();
  await loadStudents();
  setInterval(updateCountdown, 1000);
  updateCountdown();
}

init();
loginForm.addEventListener("submit", validateLogin);
