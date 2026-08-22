const newRoundBtn = document.getElementById("new-round-btn");
const statusMessage = document.getElementById("status-message");
const matchupEl = document.getElementById("matchup");
const promptMessage = document.getElementById("prompt-message");
const revealBtn = document.getElementById("reveal-btn");
const resultMessage = document.getElementById("result-message");

const cardA = document.getElementById("card-a");
const cardB = document.getElementById("card-b");
const pokeAImg = document.getElementById("poke-a-img");
const pokeBImg = document.getElementById("poke-b-img");
const pokeAName = document.getElementById("poke-a-name");
const pokeBName = document.getElementById("poke-b-name");
const pokeAStat = document.getElementById("poke-a-stat");
const pokeBStat = document.getElementById("poke-b-stat");

let currentPair = null; // { a: {name, views}, b: {name, views} }
let selectedSide = null; // "a" | "b"
let revealed = false;

function pickTwoDistinct(list) {
  const first = list[Math.floor(Math.random() * list.length)];
  let second = first;
  while (second === first) {
    second = list[Math.floor(Math.random() * list.length)];
  }
  return [first, second];
}

function getSafeMonthRange() {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${year}${pad(month + 1)}0100`;
  const end = `${year}${pad(month + 1)}${pad(lastDay)}00`;
  return { start, end };
}

async function fetchPageviews(articleTitle) {
  const { start, end } = getSafeMonthRange();
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/all-agents/${encodeURIComponent(
    articleTitle
  )}/monthly/${start}/${end}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No pageview data for ${articleTitle}`);
  const data = await response.json();
  const item = data.items && data.items[0];
  if (!item) throw new Error(`No pageview data for ${articleTitle}`);
  return item.views;
}

async function fetchSprite(name) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
    if (!response.ok) return "";
    const data = await response.json();
    return data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "";
  } catch (error) {
    return "";
  }
}

function setSelected(side) {
  selectedSide = side;
  cardA.classList.toggle("selected", side === "a");
  cardB.classList.toggle("selected", side === "b");
  revealBtn.disabled = false;
}

async function loadRound() {
  newRoundBtn.disabled = true;
  revealBtn.disabled = true;
  revealBtn.classList.add("hidden");
  promptMessage.classList.add("hidden");
  matchupEl.classList.add("hidden");
  resultMessage.textContent = "";
  resultMessage.classList.remove("correct", "incorrect");
  cardA.classList.remove("selected", "winner", "loser");
  cardB.classList.remove("selected", "winner", "loser");
  selectedSide = null;
  revealed = false;
  statusMessage.classList.remove("hidden");
  statusMessage.textContent = "Loading a matchup...";

  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const [nameA, nameB] = pickTwoDistinct(TREND_POKEMON);
    try {
      const [viewsA, viewsB, spriteA, spriteB] = await Promise.all([
        fetchPageviews(nameA),
        fetchPageviews(nameB),
        fetchSprite(nameA),
        fetchSprite(nameB),
      ]);

      currentPair = {
        a: { name: nameA, views: viewsA },
        b: { name: nameB, views: viewsB },
      };

      pokeAImg.src = spriteA;
      pokeAImg.alt = nameA;
      pokeAName.textContent = nameA;
      pokeAStat.textContent = "";

      pokeBImg.src = spriteB;
      pokeBImg.alt = nameB;
      pokeBName.textContent = nameB;
      pokeBStat.textContent = "";

      statusMessage.classList.add("hidden");
      matchupEl.classList.remove("hidden");
      promptMessage.classList.remove("hidden");
      revealBtn.classList.remove("hidden");
      newRoundBtn.disabled = false;
      return;
    } catch (error) {
      // try a different pair
    }
  }

  statusMessage.textContent = "Couldn't find page view data. Try New Round again.";
  newRoundBtn.disabled = false;
}

function revealResult() {
  if (!currentPair || !selectedSide || revealed) return;
  revealed = true;
  revealBtn.disabled = true;

  const { a, b } = currentPair;
  pokeAStat.textContent = `${a.views.toLocaleString()} views`;
  pokeBStat.textContent = `${b.views.toLocaleString()} views`;

  const winnerSide = a.views >= b.views ? "a" : "b";
  const isCorrect = selectedSide === winnerSide;

  cardA.classList.add(winnerSide === "a" ? "winner" : "loser");
  cardB.classList.add(winnerSide === "b" ? "winner" : "loser");

  if (isCorrect) {
    resultMessage.textContent = `Congrats! ${currentPair[winnerSide].name} had more page views.`;
    resultMessage.classList.add("correct");
    resultMessage.classList.remove("incorrect");
  } else {
    resultMessage.textContent = `Wrong! ${currentPair[winnerSide].name} actually had more page views.`;
    resultMessage.classList.add("incorrect");
    resultMessage.classList.remove("correct");
  }
}

cardA.addEventListener("click", () => {
  if (!revealed) setSelected("a");
});
cardB.addEventListener("click", () => {
  if (!revealed) setSelected("b");
});
revealBtn.addEventListener("click", revealResult);
newRoundBtn.addEventListener("click", loadRound);

loadRound();
