// Game state
const gameState = {
    targetCharacter: null,
    guesses: [],
    maxGuesses: 6,
    allCharacterNames: []
};

// Initialize the game
document.addEventListener('DOMContentLoaded', async () => {
    await fetchRandomCharacter();
    await fetchAllCharacterNames(); // Fetch character names for autocomplete
});

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


// Fetch a random character from the API
async function fetchRandomCharacter() {
    try {
        const response = await fetch('https://swapi.dev/api/people/');
        const data = await response.json();
        const randomIndex = Math.floor(Math.random() * data.count);
        const characterResponse = await fetch(`https://swapi.dev/api/people/${randomIndex + 1}/`);
        const characterData = await characterResponse.json();
        gameState.targetCharacter = characterData;
    } catch (error) {
        console.error('Error fetching the target character:', error);
    }
}

// Event listener for the guess button
document.getElementById('guess-button').addEventListener('click', async () => {
    const userInput = document.getElementById('guess-input').value.trim();
    document.getElementById('guess-input').value = ''; // Clear the input after the guess
    if (userInput) {
        await makeGuess(userInput);
    }
});

// Make a guess
async function makeGuess(name) {
    try {
        const response = await fetch(`https://swapi.dev/api/people/?search=${name}`);
        const data = await response.json();
        const character = data.results[0];

        if (!character) {
            alert("Character not found, try again!");
            return;
        }

        gameState.guesses.push(character);
        updateUI(character);
        checkWinCondition(character);
    } catch (error) {
        console.error('Error fetching character data:', error);
    }
}

function getHeightComparisonArrow(actualHeight, guessedHeight) {
    if (!actualHeight || !guessedHeight) {
        return '';
    }
    if (guessedHeight > actualHeight) {
        return '&#x2193;'; // Down arrow
    } else if (guessedHeight < actualHeight) {
        return '&#x2191;'; // Up arrow
    } else {
        return ''; // Equal height, no arrow
    }
}

function parseYear(yearString) {
    if (yearString.includes('BBY')) {
        return -parseInt(yearString.replace('BBY', ''), 10); // Represent BBY as negative numbers
    } else if (yearString.includes('ABY')) {
        return parseInt(yearString.replace('ABY', ''), 10); // Represent ABY as positive numbers
    } else {
        return NaN; // Handle unexpected formats
    }
}

function getBirthYearComparisonSymbol(actualBirthYear, guessedBirthYear) {
    // Remove BBY or ABY and parse the year as a number
    const parseYear = (yearString) => {
        if (yearString.includes('BBY')) {
            return -parseInt(yearString, 10); // Represent BBY as negative numbers
        } else if (yearString.includes('ABY')) {
            return parseInt(yearString, 10); // Represent ABY as positive numbers
        } else {
            return NaN;
        }
    };

    const actualYear = parseYear(actualBirthYear);
    const guessedYear = parseYear(guessedBirthYear);

    // If we don't have valid numbers after parsing, don't show any symbol
    if (isNaN(actualYear) || isNaN(guessedYear)) {
        return '';
    }

    // Compare the birth years and return the appropriate symbol
    if (guessedYear > actualYear) {
        return '&#8593;'; // Up arrow for more recent year
    } else if (guessedYear < actualYear) {
        return '&#8595;'; // Down arrow for an older year
    } else {
        return ''; // Equal years, no symbol
    }
}

// Mapping of film titles to abbreviations
const filmAbbreviations = {
    '1': 'I', // The Phantom Menace
    '2': 'II', // Attack of the Clones
    '3': 'III', // Revenge of the Sith
    '4': 'IV', // A New Hope
    '5': 'V', // The Empire Strikes Back
    '6': 'VI', // Return of the Jedi
    '7': 'VII' // The Force Awakens
};
function getFilmAbbreviations(filmUrls) {
    return filmUrls.map(url => {
        // Extract the numeric ID from the film URL
        const filmId = url.match(/films\/(\d+)\//)[1];
        return filmAbbreviations[filmId];
    });
}

// Example usage for comparison
const targetFilmAbbreviations = getFilmAbbreviations(gameState.targetCharacter.films);
const guessFilmAbbreviations = getFilmAbbreviations(guess.films);

// Determine if there's an exact match or partial match
const exactMatch = targetFilmAbbreviations.length === guessFilmAbbreviations.length &&
                   targetFilmAbbreviations.every(abbrev => guessFilmAbbreviations.includes(abbrev));
const partialMatch = guessFilmAbbreviations.some(abbrev => targetFilmAbbreviations.includes(abbrev));

// Assign color based on the match type
let colorClass;
if (exactMatch) {
    colorClass = 'bg-green-500'; // All guessed films match exactly
} else if (partialMatch) {
    colorClass = 'bg-yellow-500'; // At least one, but not all, guessed films match
} else {
    colorClass = 'bg-gray-700'; // No matches
}

function colorCodeCell(actual, guess, attribute) {
    let colorClass = 'bg-gray-700'; // Default to gray for incorrect
// Species
    if (attribute === 'species') {
        fetchAdditionalData(gameState.targetCharacter, 'species').then(targetSpecies => {
            fetchAdditionalData(guess, 'species').then(guessSpecies => {
                if (guessSpecies.name !== targetSpecies.name && guessSpecies.homeworld === targetSpecies.homeworld) {
                    // Here you set the cell to yellow since they share a homeworld but are not the same species
                    return 'bg-yellow-500'; // Yellow for close
                } else if (guessSpecies.name === targetSpecies.name) {
                    return 'bg-green-500'; // Green for correct
                } else {
                    return 'bg-gray-700'; // Gray for incorrect
                }
            });
        });
    }

    // Check for the 'height' attribute
    if (attribute === 'height') {
        const actualHeight = parseInt(actual, 10);
        const guessHeight = parseInt(guess, 10);
        if (actualHeight === guessHeight) {
            colorClass = 'bg-green-500'; // Green for correct
        } else if (Math.abs(actualHeight - guessHeight) <= 10) {
            colorClass = 'bg-yellow-400'; // Yellow for close
        }
    }
    
    else if (attribute === 'birth_year') {
        const actualYear = parseYear(actual);
        const guessedYear = parseYear(guess);

        if (actualYear === guessedYear) {
            colorClass = 'bg-green-500'; // Green for correct
        } else if (Math.abs(actualYear - guessedYear) <= 5) { // Assuming 5 is your range for "close"
            colorClass = 'bg-yellow-400'; // Yellow for close
        }
    }

    // Logic for 'films' attribute remains unchanged
    else if (attribute === 'films') {
        // Convert actual and guess film URLs to film abbreviations
        // Ensure the URL is not undefined before attempting to split
        const actualFilmsAbbreviations = actual.map(url => {
            return url ? filmAbbreviations[url.split("/")[5]] : '';
        });

        const guessFilmsAbbreviations = guess.map(url => {
            return url ? filmAbbreviations[url.split("/")[5]] : '';
        });

        // Sort the arrays for a proper comparison
        actualFilmsAbbreviations.sort();
        guessFilmsAbbreviations.sort();

        // Check if all films match exactly for green
        if (JSON.stringify(actualFilmsAbbreviations) === JSON.stringify(guessFilmsAbbreviations)) {
            colorClass = 'bg-green-500'; // Green for correct
        }
        // Check if at least one film matches for yellow
        else if (guessFilmsAbbreviations.some(film => actualFilmsAbbreviations.includes(film))) {
            colorClass = 'bg-yellow-500'; // Yellow for close
        }
    } else {
        // For species or other attributes that are direct string comparisons
        if (actual === guess) {
            colorClass = 'bg-green-500'; // Green for correct
        }
    }

    return colorClass;
}


// Fetch additional data for species, homeworld, and films
async function fetchAdditionalData(character, attr) {
    let content = 'Unknown';

    try {
        if (attr === 'species') {
            // Check if species information is available
            if (character[attr].length === 0) {
                // If no species information is available, the character is human
                content = 'Human';
            } else {
                // If species information is available, fetch it
                const speciesResponse = await fetch(character[attr][0]);
                const speciesData = await speciesResponse.json();
                content = speciesData.name;
            }
        } else if (attr === 'homeworld') {
            // Fetch homeworld data
            const homeworldResponse = await fetch(character[attr]);
            const homeworldData = await homeworldResponse.json();
            content = homeworldData.name;
        } else if (attr === 'films') {
            // Assuming character[attr] is an array of film URLs
            const filmIDs = character[attr].map(url => url.split("/").filter(Boolean).pop()); // Get the last numeric part of the URL
            content = filmIDs.map(id => filmAbbreviations[id]).join(', ');
        }        
    } catch (error) {
        console.error(`Error fetching additional data for ${attr}:`, error);
        content = 'Error fetching data';
    }

    return content;
}

// Update the UI with the guess result
async function updateUI(guess) {
    const guessGrid = document.getElementById('guess-grid');
    const guessRow = document.createElement('div');
    guessRow.className = 'grid grid-cols-7 gap-4 mb-4';

    // Define actual values for comparison
    const actualValues = {
        name: gameState.targetCharacter.name,
        height: gameState.targetCharacter.height,
        gender: gameState.targetCharacter.gender,
        species: gameState.targetCharacter.species[0] || 'Unknown',
        homeworld: gameState.targetCharacter.homeworld,
        birth_year: gameState.targetCharacter.birth_year,
        films: gameState.targetCharacter.films.map(url => filmAbbreviations[url]), // assuming the film URLs are stored in gameState.targetCharacter.films
    };

    const attributes = ['name', 'height', 'gender', 'species', 'homeworld', 'birth_year', 'films'];

    for (const attr of attributes) {
        const cell = document.createElement('div');
        cell.className = 'col-span-1 p-4 rounded text-center';

        if (attr === 'species' || attr === 'homeworld' || attr === 'films') {
            cell.textContent = 'Loading...'; // Placeholder until data is fetched
            const content = await fetchAdditionalData(guess, attr);
            cell.textContent = content; // Update with fetched data
        } else {
            let content = guess[attr] || 'Unknown';
            if (attr === 'height') {
                // Add arrow for height comparison
                const heightComparisonArrow = getHeightComparisonArrow(parseInt(actualValues.height, 10), parseInt(guess.height, 10));
                content = `${content}cm ${heightComparisonArrow}`;
            } else if (attr === 'birth_year') {
                // Add symbol for birth year comparison
                const birthYearComparisonSymbol = getBirthYearComparisonSymbol(actualValues.birth_year, guess.birth_year);
                content = `${content} ${birthYearComparisonSymbol}`;
            }
            cell.innerHTML = content; // Use innerHTML to properly render HTML entities like arrows
        }

        // Apply color coding based on correctness
        const colorClass = colorCodeCell(actualValues[attr], guess[attr], attr);
        cell.classList.add(colorClass);

        guessRow.appendChild(cell);
    }

    guessGrid.appendChild(guessRow);
}

// Configure Modal
function configureModal(title, content, success) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-content").textContent = content;
    const modalCloseButton = document.getElementById("modal-close");

    if (success) {
        modalCloseButton.classList.replace("bg-blue-500", "bg-green-500");
        modalCloseButton.classList.replace("hover:bg-blue-700", "hover:bg-green-700");
    } else {
        modalCloseButton.classList.replace("bg-green-500", "bg-blue-500");
        modalCloseButton.classList.replace("hover:bg-green-700", "hover:bg-blue-700");
    }

    showModal();
}

function showModal() {
    document.getElementById("failure-modal").classList.remove('hidden');
}

function closeModal() {
    document.getElementById("failure-modal").classList.add('hidden');
}

// Attach the closeModal function to the close button
document.getElementById("modal-close").addEventListener("click", closeModal);



function checkWinCondition(guess) {
    if (guess.name.toLowerCase() === gameState.targetCharacter.name.toLowerCase()) {
        // User wins
        const title = "Congratulations!";
        const content = "You've guessed correctly. The character was: " + gameState.targetCharacter.name + ".";
        configureModal(title, content, true);
    } else if (gameState.guesses.length >= gameState.maxGuesses) {
        // User loses
        const title = "Game Over";
        const content = "You've reached the maximum number of guesses. The character was: " + gameState.targetCharacter.name + ".";
        configureModal(title, content, false);
    }
    // Additional conditions can be added here
}

