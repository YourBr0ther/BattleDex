import { getPokemonData } from './api.js';

// DOM Elements
const textSearchBtn = document.getElementById('textSearchBtn');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const cameraSearchBtn = document.getElementById('cameraSearchBtn');
const searchSections = document.querySelectorAll('.search-section');
const pokemonSearch = document.getElementById('pokemonSearch');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('results');
const pokemonSprite = document.getElementById('pokemonSprite');
const pokemonName = document.getElementById('pokemonName');
const pokemonTypes = document.getElementById('pokemonTypes');
const pokedexText = document.getElementById('pokedexText');
const weaknessList = document.getElementById('weaknessList');

// Event Listeners
textSearchBtn.addEventListener('click', () => switchSearchMethod('textSearch'));
voiceSearchBtn.addEventListener('click', () => switchSearchMethod('voiceSearch'));
cameraSearchBtn.addEventListener('click', () => switchSearchMethod('cameraSearch'));

searchBtn.addEventListener('click', handleSearch);
pokemonSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Handle PWA installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
});

// Check for search method in URL parameters (for PWA shortcuts)
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const searchMethod = params.get('search');
    
    if (searchMethod) {
        switch (searchMethod) {
            case 'text':
                switchSearchMethod('textSearch');
                break;
            case 'voice':
                switchSearchMethod('voiceSearch');
                break;
            case 'camera':
                switchSearchMethod('cameraSearch');
                break;
        }
    }
});

/**
 * Switches between search methods
 * @param {string} methodId - ID of the search method to switch to
 */
function switchSearchMethod(methodId) {
    // Update button states
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${methodId}Btn`).classList.add('active');

    // Update section visibility
    searchSections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(methodId).classList.add('active');
}

/**
 * Handles the Pokemon search
 */
async function handleSearch() {
    const searchTerm = pokemonSearch.value.trim();
    if (!searchTerm) return;

    try {
        // Show loading state
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
        resultsSection.classList.add('hidden');

        // Fetch Pokemon data
        const pokemonData = await getPokemonData(searchTerm);
        displayPokemonData(pokemonData);

    } catch (error) {
        alert(error.message);
    } finally {
        // Reset button state
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
    }
}

/**
 * Displays Pokemon data in the UI
 * @param {Object} data - Pokemon data to display
 */
function displayPokemonData(data) {
    // Set sprite
    pokemonSprite.src = data.sprite;
    pokemonSprite.alt = `${data.name} sprite`;

    // Set name
    pokemonName.textContent = data.name;

    // Set types
    pokemonTypes.innerHTML = data.types
        .map(type => `<span class="type-badge ${type}">${type}</span>`)
        .join('');

    // Set Pokedex entry
    pokedexText.textContent = data.pokedexEntry;

    // Set weaknesses
    const weaknessesHTML = [];
    
    if (data.weaknesses.quadrupleDamageTo.length > 0) {
        weaknessesHTML.push('<div class="weakness-group"><h4>4x Damage From:</h4>');
        data.weaknesses.quadrupleDamageTo.forEach(type => {
            weaknessesHTML.push(`<span class="type-badge ${type}">${type}</span>`);
        });
        weaknessesHTML.push('</div>');
    }

    if (data.weaknesses.doubleDamageTo.length > 0) {
        weaknessesHTML.push('<div class="weakness-group"><h4>2x Damage From:</h4>');
        data.weaknesses.doubleDamageTo.forEach(type => {
            weaknessesHTML.push(`<span class="type-badge ${type}">${type}</span>`);
        });
        weaknessesHTML.push('</div>');
    }

    if (data.weaknesses.halfDamageTo.length > 0) {
        weaknessesHTML.push('<div class="weakness-group"><h4>½x Damage From:</h4>');
        data.weaknesses.halfDamageTo.forEach(type => {
            weaknessesHTML.push(`<span class="type-badge ${type}">${type}</span>`);
        });
        weaknessesHTML.push('</div>');
    }

    if (data.weaknesses.quarterDamageTo.length > 0) {
        weaknessesHTML.push('<div class="weakness-group"><h4>¼x Damage From:</h4>');
        data.weaknesses.quarterDamageTo.forEach(type => {
            weaknessesHTML.push(`<span class="type-badge ${type}">${type}</span>`);
        });
        weaknessesHTML.push('</div>');
    }

    if (data.weaknesses.noDamageTo.length > 0) {
        weaknessesHTML.push('<div class="weakness-group"><h4>Immune To:</h4>');
        data.weaknesses.noDamageTo.forEach(type => {
            weaknessesHTML.push(`<span class="type-badge ${type}">${type}</span>`);
        });
        weaknessesHTML.push('</div>');
    }

    weaknessList.innerHTML = weaknessesHTML.join('');

    // Show results
    resultsSection.classList.remove('hidden');
} 