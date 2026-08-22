const MAX_DEX_NUMBER = 1025;

const timerDisplay = document.getElementById("timer-display");
const timerMessage = document.getElementById("timer-message");
const timerEgg = document.getElementById("timer-egg");
const timerPokemonImg = document.getElementById("timer-pokemon");
const presetButtons = document.querySelectorAll(".preset-btn");
const minutesInput = document.getElementById("minutes-input");
const secondsInput = document.getElementById("seconds-input");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

let totalSeconds = 0;
let remainingSeconds = totalSeconds;
let intervalId = null;
let isPaused = false;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function renderTime() {
  timerDisplay.textContent = formatTime(remainingSeconds);

  if (document.activeElement !== minutesInput) {
    minutesInput.value = Math.floor(remainingSeconds / 60);
  }
  if (document.activeElement !== secondsInput) {
    secondsInput.value = remainingSeconds % 60;
  }
}

async function hatchRandomPokemon() {
  const id = Math.floor(Math.random() * MAX_DEX_NUMBER) + 1;
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    const sprite =
      data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "";
    timerPokemonImg.src = sprite;
    timerPokemonImg.alt = data.name;
    timerEgg.classList.add("hidden");
    timerPokemonImg.classList.remove("hidden");
  } catch (error) {
    // keep the egg showing if the hatch fetch fails
  }
}

function showEgg() {
  timerPokemonImg.classList.add("hidden");
  timerEgg.classList.remove("hidden");
}

function playBeep() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.5);
}

function setTotalSeconds(seconds) {
  clearTimer();
  totalSeconds = Math.max(0, seconds);
  remainingSeconds = totalSeconds;
  timerMessage.textContent = "";
  timerMessage.classList.remove("done");
  isPaused = false;
  updateButtonStates();
  showEgg();
  renderTime();
}

function addSeconds(amount) {
  totalSeconds += amount;
  remainingSeconds += amount;
  timerMessage.textContent = "";
  timerMessage.classList.remove("done");
  renderTime();
}

function clearTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function updateButtonStates() {
  startBtn.classList.toggle("btn-active", intervalId !== null);
  pauseBtn.classList.toggle("btn-active", isPaused);
}

function startTimer() {
  if (intervalId !== null || remainingSeconds <= 0) return;

  isPaused = false;
  updateButtonStates();

  intervalId = setInterval(() => {
    remainingSeconds -= 1;
    renderTime();

    if (remainingSeconds <= 0) {
      clearTimer();
      isPaused = false;
      updateButtonStates();
      timerMessage.textContent = "Time's up!";
      timerMessage.classList.add("done");
      hatchRandomPokemon();
      playBeep();
    }
  }, 1000);
}

function pauseTimer() {
  if (intervalId === null) return;
  clearTimer();
  isPaused = true;
  updateButtonStates();
}

function resetTimer() {
  setTotalSeconds(0);
}

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    addSeconds(Number(button.dataset.addSeconds));
  });
});

function applyCustomTime() {
  const minutes = Number(minutesInput.value) || 0;
  const seconds = Number(secondsInput.value) || 0;
  setTotalSeconds(minutes * 60 + seconds);
}

minutesInput.addEventListener("input", applyCustomTime);
secondsInput.addEventListener("input", applyCustomTime);

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

setTotalSeconds(totalSeconds);
