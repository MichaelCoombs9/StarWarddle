// Assuming character_api.json is placed in the same directory as your HTML file
const gameState = {
    characters: [],
    targetCharacter: null,
    guesses: [],
    maxGuesses: 6
};

// Function to load character data from the local JSON file
async function loadCharacterData() {
    try {
        const response = await fetch('character_api.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        gameState.characters = data;
        console.log("Character data loaded successfully", gameState.characters);
        selectRandomTargetCharacter();
    } catch (error) {
        console.error("Failed to load character data:", error);
    }
}

// Function to select a random character as the target
function selectRandomTargetCharacter() {
    if (gameState.characters.length > 0) {
        const randomIndex = Math.floor(Math.random() * gameState.characters.length);
        gameState.targetCharacter = gameState.characters[randomIndex];
        console.log(`Target character selected: ${gameState.targetCharacter.Name}`); // Use 'Name' to match your JSON structure
    } else {
        console.error("No characters available to select as target.");
    }
}

// Function to display character suggestions as user types
function displaySuggestions(suggestions, input) {
    const suggestionsDropdown = document.getElementById('suggestions-dropdown');
    suggestionsDropdown.innerHTML = '';
    suggestions.forEach(Name => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'p-2 hover:bg-gray-600 cursor-pointer';
        suggestionElement.textContent = Name;
        suggestionElement.onclick = () => {
            document.getElementById('guess-input').value = Name;
            suggestionsDropdown.innerHTML = ''; // Clear suggestions after selection
            suggestionsDropdown.style.display = 'none'; // Hide suggestions box
        };
        suggestionsDropdown.appendChild(suggestionElement);
    });
    suggestionsDropdown.style.display = suggestions.length > 0 ? 'block' : 'none';
}

// Initialize game data and UI components once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadCharacterData();
    document.getElementById('guess-input').addEventListener('input', (event) => {
        const input = event.target.value.toLowerCase();
        const filteredNames = gameState.characters
            .map(character => character.Name)
            .filter(Name => Name.toLowerCase().includes(input));
        displaySuggestions(filteredNames, input);
    });
});

async function checkGuess(guess) {
    const target = gameState.targetCharacter;
    const guessCharacter = gameState.characters.find(character => character.Name.toLowerCase() === guess.toLowerCase());

    if (!guessCharacter) {
        alert("Character not found, try again!");
        return;
    }

    const guessResult = {
        Name: guessCharacter.Name === target.Name ? 'correct' : 'incorrect',
        Height: compareHeight(target.Height, guessCharacter.Height),
        Species: compareSpecies(target.Species, guessCharacter.Species),
        Homeworld: compareHomeworld(target.Homeworld, guessCharacter.Homeworld),
        Gender: compareGender(target.Gender, guessCharacter.Gender),
        Allegiance: compareAllegiance(target.Allegiance, guessCharacter.Allegiance)
    };

    gameState.guesses.push(guessResult);
    updateUI(guessCharacter, guessResult); // Pass guessCharacter and guessResult to updateUI
    checkWinCondition();
}

// Example event listener for a guess submission button
document.getElementById('guess-button').addEventListener('click', () => {
    const guessName = document.getElementById('guess-input').value.trim();
    if (guessName) {
        checkGuess(guessName);
        document.getElementById('guess-input').value = ''; // Clear input field after guess
    }
});

function compareHeight(targetHeight, guessHeight) {
    targetHeight = parseInt(targetHeight, 10);
    guessHeight = parseInt(guessHeight, 10);
    if (isNaN(targetHeight) || isNaN(guessHeight)) return 'incorrect'; // Handle non-numeric cases
    if (targetHeight === guessHeight) return 'correct';
    if (Math.abs(targetHeight - guessHeight) <= 10) return 'close'; // Consider within 10 units as close
    return 'incorrect';
}
function getHeightComparisonArrow(targetHeight, guessHeight) {
    if (!targetHeight || !guessHeight) {
        return '';
    }
    if (guessHeight > targetHeight) {
        return '&#x2193;'; // Down arrow (guessed height is lower)
    } else if (guessHeight < targetHeight) {
        return '&#x2191;'; // Up arrow (guessed height is higher)
    } else {
        return ''; // Equal height, no arrow
    }
}


function compareSpecies(targetSpecies, guessSpecies) {
    if (!targetSpecies || !guessSpecies) return 'incorrect'; // Handle missing data
    
    // Assuming Species Names are directly provided and are case-sensitive
    if (targetSpecies === guessSpecies) return 'correct';
    
    // If you had additional logic to determine "closeness" based on Species,
    // like comparing Homeworlds or characteristics, you could implement that here.
    // For simplicity, this example does not include such logic.
    
    return 'incorrect';
}

function compareAllegiance(targetAllegiances, guessAllegiances) {
    // Split the allegiances string into arrays if it's not already an array
    const targetAllegiancesArray = typeof targetAllegiances === 'string' ? targetAllegiances.split(',').map(item => item.trim()) : targetAllegiances;
    const guessAllegiancesArray = typeof guessAllegiances === 'string' ? guessAllegiances.split(',').map(item => item.trim()) : guessAllegiances;

    // Filter out any matching allegiances between target and guess
    const matchingAllegiances = guessAllegiancesArray.filter(allegiance => targetAllegiancesArray.includes(allegiance));

    if (matchingAllegiances.length === targetAllegiancesArray.length && matchingAllegiances.length === guessAllegiancesArray.length) {
        // If all allegiances match exactly
        return 'correct';
    } else if (matchingAllegiances.length > 0) {
        // If there is at least one matching allegiance but not all
        return 'close';
    } else {
        // If there are no matching allegiances
        return 'incorrect';
    }
}

function compareHomeworld(targetHomeworld, guessHomeworld) {
    return targetHomeworld === guessHomeworld ? 'correct' : 'incorrect';
}

function compareGender(targetGender, guessGender) {
    return targetGender === guessGender ? 'correct' : 'incorrect';
}


function updateUI(guessCharacter, result) {
    const guessGrid = document.getElementById('guess-grid');

    // Create a new row element for the guess
    const guessRow = document.createElement('div');
    guessRow.className = 'grid grid-cols-6 text-center border border-black';

    // Define attributes to display and their corresponding labels
    const attributes = ['Name', 'Height', 'Gender', 'Species', 'Homeworld', 'Allegiance'];
    const labels = ['Name', 'Height', 'Gender', 'Species', 'Homeworld', 'Allegiance']; // Use labels to display in the grid

// Loop through each attribute
for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    const label = labels[i];

    // Create a cell for each attribute
    const cell = document.createElement('div');
    cell.className = `p-4 justify-center text-black border-2 border-black font-bold overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm md:text-base ${getBackgroundClass(result[attribute])}`;

    if (attribute === 'Allegiance' && guessCharacter[attribute]) {
        // Format the "Allegiance" data to display each on a new line with a bullet point
        const allegiancesList = guessCharacter[attribute].split(',').map(allegiance => `• ${allegiance.trim()}`).join('<br>');
        cell.innerHTML = allegiancesList; // Use innerHTML to render the HTML content with bullet points and line breaks
    } else if (attribute === 'Height') {
        // Add arrow for height comparison
        const heightComparisonArrow = getHeightComparisonArrow(parseInt(guessCharacter.Height, 10), parseInt(gameState.targetCharacter.Height, 10));
        cell.innerHTML = `${guessCharacter[attribute] || 'N/A'}cm ${heightComparisonArrow}`; // Use innerHTML to allow rendering of HTML entities like arrows
    } else {
        // For other attributes, use textContent to prevent HTML injection
        cell.textContent = guessCharacter[attribute] || 'N/A';
    }

    // Add label as a data attribute for styling purposes
    cell.setAttribute('data-label', label);

    // Append the cell to the row
    guessRow.appendChild(cell);
}
    // Append the row to the guess grid
    guessGrid.appendChild(guessRow);
}

function getBackgroundClass(result) {
    switch (result) {
        case 'correct':
            return 'bg-green-600'; // Green background for correct
        case 'close':
            return 'bg-yellow-500'; // Yellow background for close
        default:
            return 'bg-gray-500'; // Gray background for incorrect
    }
}


function checkWinCondition() {
    const lastGuess = gameState.guesses[gameState.guesses.length - 1];
    if (lastGuess && lastGuess.Name === 'correct') {
        showEndGameModal(true, gameState.targetCharacter.Name);
    } else if (gameState.guesses.length === gameState.maxGuesses) {
        showEndGameModal(false, gameState.targetCharacter.Name);
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
        content.textContent = "You've guessed correctly. The character was: " + gameState.targetCharacter.Name;
        closeButton.classList.remove("bg-blue-500");
        closeButton.classList.remove("hover:bg-blue-700");
        closeButton.classList.add("bg-green-500");
        closeButton.classList.add("hover:bg-green-700");
    } else {
        title.textContent = "Game Over";
        content.textContent = "You've reached the maximum number of guesses. The character was: " + gameState.targetCharacter.Name;
        closeButton.classList.remove("bg-green-500");
        closeButton.classList.remove("hover:bg-green-700");
        closeButton.classList.add("bg-blue-500");
        closeButton.classList.add("hover:bg-blue-700");
    }
    
    characterNameSpan.textContent = characterName;

    // Show the modal
    modal.classList.remove('hidden');

    // Focus the close button for accessibility
    closeButton.focus();

    // Add event listener to close the modal and reset the game state when the close button is clicked
    closeButton.addEventListener('click', () => {
    modal.classList.add('hidden');
    resetGameState();
    });

}

function resetGameState() {
    // Reload the page to reset the game state
    location.reload();
}





