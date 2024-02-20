import characterData from './character_api.json';

const gameState = {
    characters: characterData,
    targetCharacter: null,
    guesses: [],
    maxGuesses: 6
};


async function initializeGameData() {
    try {
        await fetchAllCharacterNames(); // Fetch character names for autocomplete
        gameState.characters = await fetchAllCharactersWithDetails();
        gameState.species = await fetchAllSpecies();
        gameState.films = await fetchAllFilms();
        // Further game initialization logic here, like setting up the target character
        console.log("Game data initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize game data:", error);
        // Handle initialization failure (e.g., show error message to the user)
    }
}

// Function to display suggestions
function displaySuggestions(suggestions, input) {
    const suggestionsDropdown = document.getElementById('suggestions-dropdown');
    
    // Clear previous suggestions
    suggestionsDropdown.innerHTML = '';
    
    // Hide the dropdown if there are no suggestions or if the input is empty
    if (suggestions.length === 0 || input === '') {
        suggestionsDropdown.style.display = 'none';
    } else {
        // If there are suggestions and the input is not empty, display them
        suggestions.forEach(name => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'p-2 hover:bg-gray-600 cursor-pointer';
            suggestionElement.textContent = name;
            suggestionElement.onclick = () => selectSuggestion(name);
            suggestionsDropdown.appendChild(suggestionElement);
        });
        suggestionsDropdown.style.display = 'block';
    }
}
// Function to fetch all character names from SWAPI for autocomplete suggestions
async function fetchAllCharacterNames() {
    let nextUrl = 'https://swapi.dev/api/people/';
    gameState.allCharacterNames = []; // Clear previous data

    while (nextUrl) {
        const response = await fetch(nextUrl);
        const data = await response.json();
        gameState.allCharacterNames = gameState.allCharacterNames.concat(data.results.map(character => character.name));
        nextUrl = data.next; // Proceed to the next page of results
    }
}

// Event listener for input as the user types
document.getElementById('guess-input').addEventListener('input', function(event) {
    const input = event.target.value.toLowerCase();
    // Filter the suggestions for names that start with the input value
    const suggestions = gameState.allCharacterNames.filter(name => 
        name.toLowerCase().startsWith(input)
    );
    displaySuggestions(suggestions, input); // Pass the current input value
});

// Call this function when the user selects a suggestion to fill in the textbox
function selectSuggestion(suggestedName) {
    const guessInput = document.getElementById('guess-input');
    guessInput.value = suggestedName;
    // Hide the suggestion list or reset it
    displaySuggestions([]);
}

document.getElementById('guess-button').addEventListener('click', async () => {
    const userInput = document.getElementById('guess-input').value.trim();
    if (userInput) {
        await checkGuess(userInput);
    }
    document.getElementById('guess-input').value = ''; // Clear the input after processing the guess
});


async function checkGuess(guess) {
    const target = gameState.targetCharacter;
    const guessCharacter = gameState.characters.find(character => character.name.toLowerCase() === guess.toLowerCase());

    if (!guessCharacter) {
        alert("Character not found, try again!");
        return;
    }

    // Assuming compareHeight, compareSpecies, and compareFilms are async and return promises
    const heightComparison = await compareHeight(target.height, guessCharacter.height);
    const speciesComparison = await compareSpecies(target.species, guessCharacter.species);
    const filmsComparison = await compareFilms(target.films, guessCharacter.films);

    const guessResult = {
        name: guessCharacter.name === target.name ? 'correct' : 'incorrect', // Assuming direct name comparison
        height: heightComparison,
        species: speciesComparison,
        films: filmsComparison,
    };

    gameState.guesses.push(guessResult);
    updateUI(); // Ensure updateUI properly handles async guess results
    checkWinCondition();
}


async function compareHeight(targetHeight, guessHeight) {
    targetHeight = parseInt(targetHeight, 10);
    guessHeight = parseInt(guessHeight, 10);
    if (isNaN(targetHeight) || isNaN(guessHeight)) return 'incorrect'; // Handle non-numeric cases
    if (targetHeight === guessHeight) return 'correct';
    if (Math.abs(targetHeight - guessHeight) <= 10) return 'close'; // Consider within 10 units as close
    return 'incorrect';
}

async function compareSpecies(targetSpeciesUrl, guessSpeciesUrl) {
    const targetSpecies = gameState.species[targetSpeciesUrl];
    const guessSpecies = gameState.species[guessSpeciesUrl];
    if (!targetSpecies || !guessSpecies) return 'incorrect'; // Handle missing data
    if (targetSpecies.name === guessSpecies.name) return 'correct';
    if (targetSpecies.homeworld === guessSpecies.homeworld) return 'close';
    return 'incorrect';
}


async function compareFilms(targetFilmUrls, guessFilmUrls) {
    // Check if film URLs are defined for both target and guess
    if (!targetFilmUrls || !guessFilmUrls) return 'incorrect';

    const targetFilms = targetFilmUrls.map(url => gameState.films.find(film => film.url === url)?.title);
    const guessFilms = guessFilmUrls.map(url => gameState.films.find(film => film.url === url)?.title);

    // Ensure that the targetFilms and guessFilms arrays are correctly populated
    if (targetFilms.includes(undefined) || guessFilms.includes(undefined)) return 'incorrect';

    const matchedFilms = guessFilms.filter(film => targetFilms.includes(film));
    
    if (matchedFilms.length === targetFilms.length && matchedFilms.length === guessFilms.length) return 'correct'; // Exact match
    if (matchedFilms.length > 0) return 'close'; // Partial match
    return 'incorrect';
}


function updateUI() {
    const guessGrid = document.getElementById('guess-grid');
    guessGrid.innerHTML = ''; // Clear previous entries

    gameState.guesses.forEach(guess => {
        const guessRow = document.createElement('div');
        guessRow.className = 'grid grid-cols-7 gap-4 mb-4';
        // Populate guessRow based on the guess result
        // For each attribute in guess, add a cell to the row with the appropriate color
        guessGrid.appendChild(guessRow);
    });
}


function checkWinCondition() {
    if (gameState.guesses.some(guess => guess.name)) {
        // Handle win
        showEndGameModal(true, gameState.targetCharacter.name);
    } else if (gameState.guesses.length >= gameState.maxGuesses) {
        // Handle loss
        showEndGameModal(false, gameState.targetCharacter.name);
    }
}

function showEndGameModal(win, characterName) {
    const title = document.getElementById("modal-title");
    const content = document.getElementById("modal-content");
    const modal = document.getElementById("failure-modal");
    const closeButton = document.getElementById("modal-close");
    const characterNameSpan = document.getElementById("correct-character-name");

    // Update the modal based on the game outcome
    if (win) {
        title.textContent = "Congratulations!";
        content.textContent = "You've guessed correctly. The character was: ";
        closeButton.classList.replace("bg-blue-500", "bg-green-500");
        closeButton.classList.replace("hover:bg-blue-700", "hover:bg-green-700");
    } else {
        title.textContent = "Game Over";
        content.textContent = "You've reached the maximum number of guesses. The character was: ";
        closeButton.classList.replace("bg-green-500", "bg-blue-500");
        closeButton.classList.replace("hover:bg-green-700", "hover:bg-blue-700");
    }

    characterNameSpan.textContent = characterName;

    // Show the modal
    modal.classList.remove('hidden');

    // Focus the close button for accessibility
    closeButton.focus();
}

// Ensure the modal can be closed when clicking the button
document.getElementById("modal-close").addEventListener("click", function() {
    document.getElementById("failure-modal").classList.add('hidden');
});


document.addEventListener('DOMContentLoaded', async () => {
    await initializeGameData();
    selectRandomTargetCharacter();
    // Any other setup as needed
});

function selectRandomTargetCharacter() {
    const randomIndex = Math.floor(Math.random() * gameState.characters.length);
    gameState.targetCharacter = gameState.characters[randomIndex];
}


