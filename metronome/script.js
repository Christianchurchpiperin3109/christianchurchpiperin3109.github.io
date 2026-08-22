const API_BASE = "https://api.pokemontcg.io/v2/cards";
const PAGE_SIZE = 250;

const newMoveBtn = document.getElementById("new-move-btn");
const statusMessage = document.getElementById("status-message");
const moveCard = document.getElementById("move-card");
const moveName = document.getElementById("move-name");
const moveMeta = document.getElementById("move-meta");
const guessInput = document.getElementById("guess-input");
const guessBtn = document.getElementById("guess-btn");
const resultMessage = document.getElementById("result-message");
const resultCardImg = document.getElementById("result-card-img");

let currentMoveName = "";

function extractBaseName(cardName) {
  return cardName
    .replace(
      /\s*(V-UNION|VSTAR|VMAX|V|GX|EX|ex|BREAK|Prime|LEGEND|Star|Radiant|Tag Team|δ|◇|\*).*$/i,
      ""
    )
    .trim();
}

async function fetchRandomMove() {
  const countResponse = await fetch(`${API_BASE}?q=supertype:Pokémon&pageSize=1`);
  const countData = await countResponse.json();
  const totalPages = Math.max(1, Math.ceil(countData.totalCount / PAGE_SIZE));
  const randomPage = Math.floor(Math.random() * totalPages) + 1;

  const pageResponse = await fetch(
    `${API_BASE}?q=supertype:Pokémon&pageSize=${PAGE_SIZE}&page=${randomPage}`
  );
  const pageData = await pageResponse.json();

  const cardsWithAttacks = pageData.data.filter((card) => card.attacks && card.attacks.length > 0);
  if (cardsWithAttacks.length === 0) {
    throw new Error("No attacks found on this page, try again");
  }

  const card = cardsWithAttacks[Math.floor(Math.random() * cardsWithAttacks.length)];
  const attack = card.attacks[Math.floor(Math.random() * card.attacks.length)];
  return attack;
}

async function newMove() {
  newMoveBtn.disabled = true;
  statusMessage.textContent = "Finding a move...";
  moveCard.classList.add("hidden");
  resultMessage.textContent = "";
  resultCardImg.classList.add("hidden");
  guessInput.value = "";

  try {
    const attack = await fetchRandomMove();
    currentMoveName = attack.name;

    moveName.textContent = attack.name;
    const costText = attack.cost && attack.cost.length > 0 ? attack.cost.join(", ") : "No cost";
    const damageText = attack.damage ? `${attack.damage} damage` : "No damage";
    moveMeta.textContent = `${costText} • ${damageText}`;

    statusMessage.textContent = "";
    moveCard.classList.remove("hidden");
    guessInput.focus();
  } catch (error) {
    statusMessage.textContent = "Something went wrong finding a move. Try again.";
  } finally {
    newMoveBtn.disabled = false;
  }
}

async function submitGuess() {
  const guess = guessInput.value.trim();
  if (!guess) return;

  guessBtn.disabled = true;
  resultMessage.textContent = "Checking...";
  resultCardImg.classList.add("hidden");

  try {
    const query = encodeURIComponent(`attacks.name:"${currentMoveName}"`);
    const response = await fetch(`${API_BASE}?q=${query}&pageSize=250`);
    const data = await response.json();

    const guessLower = guess.toLowerCase();
    const match = data.data.find((card) => {
      const base = extractBaseName(card.name).toLowerCase();
      return base === guessLower || card.name.toLowerCase().includes(guessLower);
    });

    if (match) {
      resultMessage.textContent = `Congrats! ${match.name} knows ${currentMoveName}.`;
      resultMessage.classList.add("correct");
      resultMessage.classList.remove("incorrect");
      resultCardImg.src = match.images?.large || match.images?.small || "";
      resultCardImg.alt = match.name;
      resultCardImg.classList.remove("hidden");
    } else {
      resultMessage.textContent = "Not quite! Try another Pokémon.";
      resultMessage.classList.add("incorrect");
      resultMessage.classList.remove("correct");
    }
  } catch (error) {
    resultMessage.textContent = "Something went wrong checking that guess. Try again.";
  } finally {
    guessBtn.disabled = false;
  }
}

newMoveBtn.addEventListener("click", newMove);
guessBtn.addEventListener("click", submitGuess);
guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitGuess();
});
