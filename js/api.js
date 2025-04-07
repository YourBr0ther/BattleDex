// Base URL for PokeAPI
const API_BASE_URL = 'https://pokeapi.co/api/v2';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Fetches Pokemon data by name or ID
 * @param {string|number} nameOrId - Pokemon name or ID
 * @returns {Promise<Object>} Pokemon data
 */
export async function getPokemonData(nameOrId) {
    try {
        const normalizedInput = String(nameOrId).toLowerCase();
        
        // Try to get from cache first
        const cachedData = await getCachedData(`pokemon_${normalizedInput}`);
        if (cachedData) return cachedData;

        // Fetch Pokemon basic data
        const pokemonResponse = await fetch(`${API_BASE_URL}/pokemon/${normalizedInput}`);
        const pokemonData = await pokemonResponse.json();

        // Fetch species data for Pokedex entries
        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();

        // Get the latest English Pokedex entry
        const pokedexEntry = getLatestPokedexEntry(speciesData);

        // Calculate type weaknesses
        const weaknesses = await calculateTypeWeaknesses(pokemonData.types);

        // Construct the final Pokemon data object
        const finalData = {
            id: pokemonData.id,
            name: pokemonData.name,
            types: pokemonData.types.map(type => type.type.name),
            weaknesses,
            pokedexEntry,
            sprite: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default
        };

        // Cache the data
        await cacheData(`pokemon_${normalizedInput}`, finalData);

        return finalData;
    } catch (error) {
        console.error('Error fetching Pokemon data:', error);
        throw new Error('Failed to fetch Pokemon data. Please try again.');
    }
}

/**
 * Gets the latest English Pokedex entry from species data
 * @param {Object} speciesData - Pokemon species data
 * @returns {string} Latest Pokedex entry
 */
function getLatestPokedexEntry(speciesData) {
    const englishEntries = speciesData.flavor_text_entries
        .filter(entry => entry.language.name === 'en');
    
    // Get the latest entry
    const latestEntry = englishEntries[englishEntries.length - 1];
    
    // Clean up the text (remove extra spaces and special characters)
    return latestEntry ? latestEntry.flavor_text.replace(/[\n\f]/g, ' ').replace(/\s+/g, ' ') : 'No Pokedex entry available.';
}

/**
 * Calculates type weaknesses for given Pokemon types
 * @param {Array} types - Array of Pokemon types
 * @returns {Promise<Object>} Type effectiveness data
 */
async function calculateTypeWeaknesses(types) {
    try {
        const typeEffectiveness = {
            quadrupleDamageTo: [],
            doubleDamageTo: [],
            normalDamageTo: [],
            halfDamageTo: [],
            quarterDamageTo: [],
            noDamageTo: []
        };

        // Fetch type data for each of the Pokemon's types
        const typePromises = types.map(type => 
            fetch(`${API_BASE_URL}/type/${type.type.name}`)
                .then(response => response.json())
        );

        const typeData = await Promise.all(typePromises);

        // Calculate combined type effectiveness
        const effectiveness = new Map();

        typeData.forEach(type => {
            type.damage_relations.double_damage_from.forEach(t => {
                effectiveness.set(t.name, (effectiveness.get(t.name) || 1) * 2);
            });
            type.damage_relations.half_damage_from.forEach(t => {
                effectiveness.set(t.name, (effectiveness.get(t.name) || 1) * 0.5);
            });
            type.damage_relations.no_damage_from.forEach(t => {
                effectiveness.set(t.name, 0);
            });
        });

        // Categorize effectiveness
        effectiveness.forEach((value, type) => {
            if (value === 4) typeEffectiveness.quadrupleDamageTo.push(type);
            else if (value === 2) typeEffectiveness.doubleDamageTo.push(type);
            else if (value === 1) typeEffectiveness.normalDamageTo.push(type);
            else if (value === 0.5) typeEffectiveness.halfDamageTo.push(type);
            else if (value === 0.25) typeEffectiveness.quarterDamageTo.push(type);
            else if (value === 0) typeEffectiveness.noDamageTo.push(type);
        });

        return typeEffectiveness;
    } catch (error) {
        console.error('Error calculating type weaknesses:', error);
        throw new Error('Failed to calculate type weaknesses.');
    }
}

/**
 * Gets cached data from IndexedDB
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Cached data or null
 */
async function getCachedData(key) {
    try {
        const db = await openDB();
        const transaction = db.transaction('pokemon', 'readonly');
        const store = transaction.objectStore('pokemon');
        const data = await store.get(key);

        if (data && Date.now() - data.timestamp < CACHE_DURATION) {
            return data.value;
        }
        return null;
    } catch (error) {
        console.warn('Error reading from cache:', error);
        return null;
    }
}

/**
 * Caches data in IndexedDB
 * @param {string} key - Cache key
 * @param {Object} value - Data to cache
 */
async function cacheData(key, value) {
    try {
        const db = await openDB();
        const transaction = db.transaction('pokemon', 'readwrite');
        const store = transaction.objectStore('pokemon');
        await store.put({
            key,
            value,
            timestamp: Date.now()
        });
    } catch (error) {
        console.warn('Error writing to cache:', error);
    }
}

/**
 * Opens IndexedDB connection
 * @returns {Promise<IDBDatabase>} IndexedDB database instance
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('battledex', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pokemon')) {
                db.createObjectStore('pokemon', { keyPath: 'key' });
            }
        };
    });
} 