const WEATHER_CODE_MAP = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mostly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Foggy", emoji: "🌫️" },
  48: { label: "Foggy", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  56: { label: "Freezing drizzle", emoji: "🌧️" },
  57: { label: "Freezing drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌦️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  66: { label: "Freezing rain", emoji: "🌧️" },
  67: { label: "Freezing rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  77: { label: "Snow grains", emoji: "❄️" },
  80: { label: "Rain showers", emoji: "🌦️" },
  81: { label: "Rain showers", emoji: "🌧️" },
  82: { label: "Violent rain showers", emoji: "⛈️" },
  85: { label: "Snow showers", emoji: "🌨️" },
  86: { label: "Snow showers", emoji: "🌨️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm with hail", emoji: "⛈️" },
  99: { label: "Thunderstorm with hail", emoji: "⛈️" },
};

const randomizeBtn = document.getElementById("randomize-btn");
const statusMessage = document.getElementById("status-message");
const placeCard = document.getElementById("place-card");
const placePhoto = document.getElementById("place-photo");
const placeName = document.getElementById("place-name");
const placeRegion = document.getElementById("place-region");
const weatherEmoji = document.getElementById("weather-emoji");
const weatherCondition = document.getElementById("weather-condition");
const weatherTemp = document.getElementById("weather-temp");

function pickRandomCity() {
  const index = Math.floor(Math.random() * WEATHER_GAME_CITIES.length);
  return WEATHER_GAME_CITIES[index];
}

async function fetchWeather(city) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&temperature_unit=fahrenheit`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather request failed");
  const data = await response.json();
  return data.current_weather;
}

async function fetchPlacePhoto(city) {
  const query = encodeURIComponent(`${city.name}, ${city.country}`);
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
    if (!response.ok) throw new Error("No summary found");
    const data = await response.json();
    return data.thumbnail?.source || data.originalimage?.source || "";
  } catch (error) {
    return "";
  }
}

function formatRegionLine(city) {
  return city.region ? `${city.region}, ${city.country}` : city.country;
}

async function randomizePlace() {
  randomizeBtn.disabled = true;
  statusMessage.textContent = "Finding a place...";
  placeCard.classList.add("hidden");

  const city = pickRandomCity();

  try {
    const [weather, photoUrl] = await Promise.all([fetchWeather(city), fetchPlacePhoto(city)]);
    const conditionInfo = WEATHER_CODE_MAP[weather.weathercode] || { label: "Unknown", emoji: "🌡️" };

    placeName.textContent = city.name;
    placeRegion.textContent = formatRegionLine(city);
    placePhoto.src = photoUrl;
    placePhoto.alt = city.name;
    placePhoto.classList.toggle("hidden", !photoUrl);

    weatherEmoji.textContent = conditionInfo.emoji;
    weatherCondition.textContent = conditionInfo.label;
    weatherTemp.textContent = `${Math.round(weather.temperature)}°F`;

    statusMessage.textContent = "";
    placeCard.classList.remove("hidden");
  } catch (error) {
    statusMessage.textContent = "Something went wrong fetching that place. Try again.";
  } finally {
    randomizeBtn.disabled = false;
  }
}

randomizeBtn.addEventListener("click", randomizePlace);
