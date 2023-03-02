const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-bar");
const searchButton = document.getElementById("search-btn");
const prevButton = document.getElementById("prev-btn");
const nextButton = document.getElementById("next-btn");
const message = document.getElementById("message");
const main = document.getElementById("main");

var apiKey;
var index;
var searchResults;
var query = "";

const cache = {};

document.addEventListener("DOMContentLoaded", function () {
  getApiKey();

  getSelectedText();

  addListeners();
});

function getApiKey() {
  chrome.storage.sync.get("apiKey", function (data) {
    if (!data.apiKey) {
      setMessage(
        "No API key found. Please set an API key in the options menu. API key can be generated from https://www.omdbapi.com/apikey.aspx"
      );
      return;
    }
    apiKey = data.apiKey;
  });
}

function setMessage(msg) {
  message.innerText = msg;

  message.style.display = "block";
  main.style.display = "none";
}

async function getSelectedText() {
  let result;
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  try {
    [{ result }] = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
      },
      function: () => {
        return window.getSelection().toString().substr(0, 64);
      },
    });
  } catch (e) {
    return; // ignoring an unsupported page like chrome://extensions
  }

  if (!result) {
    searchInput.focus();
    return;
  }

  searchInput.value = result;
  searchInput.focus();
  searchButton.click();
}

function addListeners() {
  let debounceTimeoutId;

  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimeoutId);

    debounceTimeoutId = setTimeout(function () {
      handleSearch();
    }, 1000);
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleSearch();
  });

  prevButton.addEventListener("click", handlePrevButtonClick);
  nextButton.addEventListener("click", handleNextButtonClick);
}

function handleSearch() {
  let newQuery = searchInput.value.trim();

  if (newQuery.length === 0) {
    main.style.display = "none";
    return;
  }

  if (query === newQuery) {
    return;
  }
  query = newQuery;
  search(query, apiKey);
}

function search(query, apiKey) {
  if (!query || !apiKey) {
    return;
  }

  setMessage(`Searching for "${query}"`);
  let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${query}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.Response === "False") {
        setMessage(data.Error);
        return;
      }

      index = 0;
      searchResults = [...data.Search];
      fetchResult(searchResults[index].imdbID, apiKey);
    })
    .catch((error) => {
      setMessage(error);
    });
}

function handlePrevButtonClick() {
  index = (index - 1 + searchResults.length) % searchResults.length;
  fetchResult(searchResults[index].imdbID, apiKey);
}

function handleNextButtonClick() {
  index = (index + 1) % searchResults.length;
  fetchResult(searchResults[index].imdbID, apiKey);
}

function updateUI(data) {
  if (data.Poster !== "N/A") {
    document.getElementById("poster").src = data.Poster;
  } else {
    document.getElementById("poster").src = "../images/404.png";
  }
  if (data.Title !== "N/A") {
    document.getElementById("title").innerText = data.Title;
  }
  if (data.Year !== "N/A") {
    document.getElementById("year").innerText = ` (${data.Year})`;
  }
  if (data.imdbRating !== "N/A") {
    document.getElementById(
      "imdb-rating"
    ).innerText = `IMDb Rating: ${data.imdbRating}`;
  }
  if (data.Runtime !== "N/A") {
    document.getElementById("runtime").innerText = `Runtime: ${data.Runtime}`;
  }
  if (data.Director !== "N/A") {
    document.getElementById(
      "director"
    ).innerText = `Directed by: ${data.Director}`;
  }
  if (data.Actors !== "N/A") {
    document.getElementById("cast").innerText = `Cast: ${data.Actors}`;
  }
  if (data.Plot !== "N/A") {
    document.getElementById("plot").innerText = data.Plot;
  }

  document.getElementById(
    "imdb-link"
  ).href = `https://www.imdb.com/title/${data.imdbID}`;
  document.getElementById(
    "imdb-link-text"
  ).href = `https://www.imdb.com/title/${data.imdbID}`;

  message.style.display = "none";
  main.style.display = "flex";
}

function fetchResult(imdbID, apiKey) {
  let imdbUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}&plot=short`;
  let data;

  if (cache[imdbID]) {
    data = cache[imdbID];
    updateUI(data);
  } else {
    fetch(imdbUrl)
      .then((response) => response.json())
      .then((data) => {
        updateUI(data);
        cache[imdbID] = data;
      })
      .catch((error) => {
        setMessage(error);
      });
  }
}
