/**
 * Script to gather Pokemon image URLs from PokeAPI
 */

// We'll focus on the first 151 Pokemon (Gen 1) initially
const POKEMON_COUNT = 151;
const IMAGE_SOURCES = {
    official: 'official-artwork',
    sprites: ['front_default', 'back_default'],
    versions: {
        'generation-v': {
            'black-white': ['front_default', 'back_default', 'animated']
        }
    }
};

/**
 * Fetch Pokemon data and extract image URLs
 * @returns {Promise<Object>} Pokemon name to image URLs mapping
 */
async function gatherPokemonImages() {
    const dataset = {};
    
    console.log('Starting to gather Pokemon images...');
    
    for (let i = 1; i <= POKEMON_COUNT; i++) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
            const pokemon = await response.json();
            const name = pokemon.name.toLowerCase();
            const imageUrls = new Set(); // Use Set to avoid duplicates
            
            // Get official artwork
            const officialArtwork = pokemon.sprites.other['official-artwork'].front_default;
            if (officialArtwork) {
                imageUrls.add(officialArtwork);
            }

            // Get regular sprites
            if (pokemon.sprites.front_default) {
                imageUrls.add(pokemon.sprites.front_default);
            }
            if (pokemon.sprites.back_default) {
                imageUrls.add(pokemon.sprites.back_default);
            }

            // Get animated sprites from Black/White
            const bwSprites = pokemon.sprites.versions['generation-v']['black-white'];
            if (bwSprites.animated?.front_default) {
                imageUrls.add(bwSprites.animated.front_default);
            }
            if (bwSprites.animated?.back_default) {
                imageUrls.add(bwSprites.animated.back_default);
            }

            // Store unique URLs for this Pokemon
            dataset[name] = Array.from(imageUrls);
            
            console.log(`Gathered ${imageUrls.size} images for ${name}`);
            
            // Be nice to the API - add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Failed to fetch Pokemon #${i}:`, error);
        }
    }
    
    return dataset;
}

/**
 * Save the dataset to localStorage and download as JSON
 * @param {Object} dataset - The gathered dataset
 */
function saveDataset(dataset) {
    // Save to localStorage
    localStorage.setItem('pokemonDataset', JSON.stringify(dataset));
    
    // Create downloadable JSON file
    const dataStr = JSON.stringify(dataset, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokemon-dataset.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Create a simple UI for dataset gathering
document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.innerHTML = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <h1>Pokemon Dataset Gatherer</h1>
            <button id="gatherBtn" style="padding: 10px 20px; font-size: 16px;">
                Gather Pokemon Images
            </button>
            <div id="progress" style="margin-top: 20px;"></div>
        </div>
    `;
    document.body.appendChild(container);
    
    const progressDiv = document.getElementById('progress');
    const gatherBtn = document.getElementById('gatherBtn');
    
    gatherBtn.addEventListener('click', async () => {
        gatherBtn.disabled = true;
        progressDiv.textContent = 'Gathering Pokemon images... This may take a few minutes.';
        
        try {
            const dataset = await gatherPokemonImages();
            saveDataset(dataset);
            progressDiv.textContent = 'Dataset gathered and saved successfully! Check your downloads folder.';
        } catch (error) {
            progressDiv.textContent = 'Error gathering dataset: ' + error.message;
            console.error('Error:', error);
        } finally {
            gatherBtn.disabled = false;
        }
    });
}); 