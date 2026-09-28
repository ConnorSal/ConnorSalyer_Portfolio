const quoteDisplay = document.getElementById("quoteDisplay");
const quoteInput = document.getElementById("quoteInput");
const timer = document.getElementById("timer");
const wpmDisplay = document.getElementById("wpm");
const overlay = document.getElementById("overlay");
const overlayText = document.querySelector(".overlay-text");
const bestWpmDisplay = document.getElementById("bestWpm");

const keySound = new Audio("Sounds/Keyboard.wav");
const errorSound = new Audio("Sounds/Error.wav");
const bgSound = new Audio("Sounds/Terminal.wav");

errorSound.volume = .50;
bgSound.loop = true; 

let totalTypedChars = 0;
let currentWpm = 0;
let gameActive = false;
let bestWpm = 0;
let mistakes = 0;

const keyboardChars = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  ..."!@#$%^&*()_+-=[]{}|;:',.<>/?`~"
];

let timerInterval;
let startTime;

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !overlay.classList.contains("hidden")) {
    e.preventDefault();
    overlay.classList.add("hidden");
    quoteInput.focus();
    startGame();
  }
});

function startGame() {
  gameActive = true;
  totalTypedChars = 0;
  currentWpm = 0;
  mistakes = 0;
  quoteInput.value = "";
  bgSound.currentTime = 0;
  bgSound.play();
  renderNewQuote();
  startTimer();
  wpmDisplay.textContent = "WPM: 0";
  document.getElementById("mistakes").textContent = "0";
}

function getRandomKeyboardString(length = 25) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += keyboardChars[Math.floor(Math.random() * keyboardChars.length)];
  }
  return result;
}

function startTimer() {
  stopTimer();
  startTime = new Date();
  timer.textContent = "0";
  totalTypedChars = 0;
  currentWpm = 0;

  timerInterval = setInterval(() => {
    const seconds = getTimerTime();
    timer.textContent = seconds;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function getTimerTime() {
  return Math.floor((new Date() - startTime) / 1000);
}

function renderNewQuote() {
  const quote = getRandomKeyboardString(25);
  quoteDisplay.innerHTML = "";
  quote.split("").forEach(char => {
    const span = document.createElement("span");
    span.textContent = char;
    quoteDisplay.appendChild(span);
  });
  quoteInput.value = "";
  totalTypedChars = 0;
  mistakes = 0;
  wpmDisplay.textContent = "WPM: 0";
  document.getElementById("mistakes").textContent = "0";
  startTimer();
}

quoteInput.addEventListener("input", () =>
{

  const arrayQuote = quoteDisplay.querySelectorAll("span");
  const arrayValue = quoteInput.value.split("");

  let allCorrect = true;
  let firstErrorIndex = -1;

  arrayQuote.forEach((span, i) => {
    const char = arrayValue[i];
    if (char == null) 
    {
      span.classList.remove("correct", "incorrect");
      allCorrect = false;
    } else if (char === span.textContent)
    {
      keySound.currentTime = 0;
      keySound.play();
      span.classList.add("correct");
      span.classList.remove("incorrect");
    } else
    {
      errorSound.currentTime = 0;
      errorSound.play();
      span.classList.add("incorrect");
      span.classList.remove("correct");
      allCorrect = false;

      if (firstErrorIndex === -1) firstErrorIndex = i;

      mistakes++;
      document.getElementById("mistakes").textContent = `${mistakes}`;

      const totalTyped = totalTypedChars + mistakes;
      const accuracy = totalTyped > 0
        ? Math.max(0, ((totalTyped - mistakes) / totalTyped) * 100)
        : 100;
      console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
    }
  });

  if (firstErrorIndex !== -1) {
    quoteInput.value = arrayValue.slice(0, firstErrorIndex).join("");
    quoteInput.classList.add("error");
    setTimeout(() => quoteInput.classList.remove("error"), 300);
  }

  totalTypedChars = quoteInput.value.length;

  const timeInMinutes = (new Date() - startTime) / 1000 / 60;
  const wpm = Math.floor((totalTypedChars / 5) / timeInMinutes) || 0;
  wpmDisplay.textContent = `WPM: ${wpm}`;

  if (arrayValue.length === arrayQuote.length && allCorrect) {
    stopTimer();

    const timeInMinutes = (new Date() - startTime) / 1000 / 60;
    currentWpm = Math.floor((totalTypedChars / 5) / timeInMinutes);

    if (currentWpm > bestWpm) {
      bestWpm = currentWpm;
      bestWpmDisplay.textContent = `Best: ${bestWpm}`;
      saveBestWpm();
    }

    setTimeout(() => {
      overlay.classList.remove("hidden");
      overlayText.textContent = "Press Space to Start Again";
      gameActive = false;
    }, 300);
  }
});

window.addEventListener("load", () => {
  const savedBest = localStorage.getItem("bestWpm");
  if (savedBest) {
    bestWpm = parseInt(savedBest);
    bestWpmDisplay.textContent = `Best: ${bestWpm}`;
  }
});

function saveBestWpm() {
  localStorage.setItem("bestWpm", bestWpm);
}
