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
const yard = document.getElementById("yard");

const MAX_ROAMERS = 15;
let roamerCount = 0;

// keep wanderers mostly clear of the timer panel in the middle of the screen
const SAFE_ZONE = { left: 26, right: 74, top: 20, bottom: 80 };

function pickEdgePosition() {
  const onLeftHalf = Math.random() < 0.5;
  const onTopHalf = Math.random() < 0.5;
  const left = onLeftHalf ? 4 + Math.random() * (SAFE_ZONE.left - 8) : SAFE_ZONE.right + Math.random() * (96 - SAFE_ZONE.right);
  const top = onTopHalf ? 8 + Math.random() * (SAFE_ZONE.top - 12) : SAFE_ZONE.bottom + Math.random() * (92 - SAFE_ZONE.bottom);
  return { left, top };
}

function nudgePosition(currentLeft, currentTop) {
  let nextLeft = currentLeft + (Math.random() * 2 - 1) * 7;
  let nextTop = currentTop + (Math.random() * 2 - 1) * 7;
  nextLeft = Math.max(4, Math.min(96, nextLeft));
  nextTop = Math.max(6, Math.min(94, nextTop));

  const inSafeZone =
    nextLeft > SAFE_ZONE.left && nextLeft < SAFE_ZONE.right && nextTop > SAFE_ZONE.top && nextTop < SAFE_ZONE.bottom;

  if (inSafeZone) {
    return pickEdgePosition();
  }

  return { left: nextLeft, top: nextTop };
}

let totalSeconds = 0;
let remainingSeconds = totalSeconds;
let intervalId = null;
let shakeIntervalId = null;
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
      data.sprites?.front_default || data.sprites?.other?.["official-artwork"]?.front_default || "";
    timerPokemonImg.src = sprite;
    timerPokemonImg.alt = data.name;
    timerEgg.classList.add("hidden");
    timerPokemonImg.classList.remove("hidden");
    spawnRoamer(sprite, data.name);
  } catch (error) {
    // keep the egg showing if the hatch fetch fails
  }
}

function spawnRoamer(spriteUrl, name) {
  if (!spriteUrl) return;

  const roamer = document.createElement("img");
  roamer.src = spriteUrl;
  roamer.alt = name || "Pokémon";
  roamer.className = "roaming-pokemon";
  const start = pickEdgePosition();
  roamer.style.left = `${start.left}%`;
  roamer.style.top = `${start.top}%`;
  yard.appendChild(roamer);

  roamerCount += 1;
  updateDaycareCount();
  if (roamerCount > MAX_ROAMERS) {
    const oldest = yard.querySelector(".roaming-pokemon");
    if (oldest) oldest.remove();
    roamerCount -= 1;
    updateDaycareCount();
  }

  wanderLoop(roamer);
}

function updateDaycareCount() {
  const counterEl = document.getElementById("daycare-count");
  if (counterEl) {
    counterEl.textContent = String(roamerCount);
  }
}

function wanderLoop(roamer) {
  function step() {
    const currentLeft = parseFloat(roamer.style.left) || 0;
    const currentTop = parseFloat(roamer.style.top) || 0;
    const next = nudgePosition(currentLeft, currentTop);
    roamer.style.transform = next.left < currentLeft ? "scaleX(-1)" : "scaleX(1)";
    roamer.style.left = `${next.left}%`;
    roamer.style.top = `${next.top}%`;
    setTimeout(step, 5000 + Math.random() * 4000);
  }
  setTimeout(step, 1500 + Math.random() * 3000);
}

function showEgg() {
  timerPokemonImg.classList.add("hidden");
  timerEgg.classList.remove("hidden");
}

function shakeEgg() {
  timerEgg.classList.remove("shake");
  // force reflow so the animation can retrigger
  void timerEgg.offsetWidth;
  timerEgg.classList.add("shake");
}

function startShaking() {
  stopShaking();
  shakeIntervalId = setInterval(shakeEgg, 4000);
}

function stopShaking() {
  if (shakeIntervalId !== null) {
    clearInterval(shakeIntervalId);
    shakeIntervalId = null;
  }
  timerEgg.classList.remove("shake");
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
  stopShaking();
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
  startShaking();

  intervalId = setInterval(() => {
    remainingSeconds -= 1;
    renderTime();

    if (remainingSeconds <= 0) {
      clearTimer();
      stopShaking();
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
  stopShaking();
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
