// DOM Objects
const mainScreen = document.querySelector('.main-screen');
const pokeName = document.querySelector('.poke-name');
const pokeId = document.querySelector('.poke-id');
const pokeFrontImage = document.querySelector('.poke-front-image');
const pokeBackImage = document.querySelector('.poke-back-image');
const pokeTypeOne = document.querySelector('.poke-type-one');
const pokeTypeTwo = document.querySelector('.poke-type-two');
const pokeDescription = document.querySelector('.poke-description');
const pokeListItems = document.querySelectorAll('.list-item');
const leftButton = document.querySelector('.left-button');
const rightButton = document.querySelector('.right-button');

// New UI Objects
const cryBtn = document.querySelector('#cry-btn');
const pokeAudio = document.querySelector('#poke-cry');
const shinyCB = document.querySelector('#shiny-cb');
const searchInput = document.querySelector('#poke-input');
const searchButton = document.querySelector('#search-button');
const formBtn = document.querySelector('#middle-button');
const statsContainer = document.querySelector('.stats-container');
const pokeInfoContainer = document.querySelector('.poke-info-container');
const statLabels = {
  hp: document.querySelector('#stat-hp-label'),
  atk: document.querySelector('#stat-atk-label'),
  def: document.querySelector('#stat-def-label'),
  spe: document.querySelector('#stat-spe-label'),
  spa: document.querySelector('#stat-spa-label'),
  spd: document.querySelector('#stat-spd-label')
};
const statBars = {
  hp: document.querySelector('#stat-hp'),
  atk: document.querySelector('#stat-atk'),
  def: document.querySelector('#stat-def'),
  spe: document.querySelector('#stat-spe'),
  spa: document.querySelector('#stat-spa'),
  spd: document.querySelector('#stat-spd')
};
// Variables for state
let prevUrl = null;
let nextUrl = null;
let currentSpriteURL = { front: '', back: '' };
let shinySpriteURL = { front: '', back: '' };
let currentFormIndex = 0;
let availableForms = [];
let ogIndex = 0;

const TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 
  'dragon', 'dark', 'steel', 'fairy'
];

// Helper Functions
const capitalize = (str) => str ? str[0].toUpperCase() + str.substr(1) : '';

const resetScreen = () => {
  mainScreen.classList.remove('hide');
  // We keep the stats hidden if we are showing instructions
  statsContainer.classList.add('hide'); 
  
  for (const type of TYPES) {
    mainScreen.classList.remove(type);
  }
};

// Update Image Logic (Shiny vs Normal)
const updateImages = () => {
  const isShiny = shinyCB.checked;
  const sprites = isShiny ? shinySpriteURL : currentSpriteURL;

  // Set the front image
  pokeFrontImage.src = sprites.front || '';

  if (sprites.back) {
    // Show back sprite if it exists
    pokeBackImage.src = sprites.back;
    pokeBackImage.style.display = 'block';
    // Reset transform to the side-by-side view
    pokeFrontImage.style.transform = 'translateX(-70px)';
    pokeBackImage.style.transform = 'translateX(70px)';
  } else {
    // Hide back sprite and center the front sprite
    pokeBackImage.src = '';
    pokeBackImage.style.display = 'none';
    pokeFrontImage.style.transform = 'translateX(0)'; // Center the only image
  }
};

// Fetch Individual Pokemon Data
const fetchPokeData = id => {
  pokeBackImage.classList.remove('screen-glitch');
  pokeFrontImage.classList.remove('screen-glitch');
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    .then(res => {
      if (!res.ok) throw new Error('Pokemon not found');
      return res.json();
    })
    .then(data => {
      resetScreen();
      void pokeFrontImage.offsetWidth;
      void pokeBackImage.offsetWidth;
      pokeFrontImage.classList.add('screen-glitch');
      pokeBackImage.classList.add('screen-glitch'); // Clears types
      statsContainer.classList.remove('hide');
      pokeInfoContainer.classList.remove('hide');
      ogIndex = data.id;
      // 1. Basic Info
      const cleanName = data.name.split('-').map(part => capitalize(part)).join(' ');
      pokeName.textContent = cleanName;
      const displayId = ogIndex > 10000 ? pokeId.textContent : '#' + ogIndex.toString().padStart(3, '0');
      pokeId.textContent = displayId;

            // 2. Sprites Storage
        const sprites = data.sprites;
        const officialArtwork = data.sprites.other['official-artwork'].front_default;

        // Store standard sprites with official artwork as fallback
        currentSpriteURL = {
          front: sprites.front_default || officialArtwork,
          back: sprites.back_default
        };

        shinySpriteURL = {
          front: sprites.front_shiny || sprites.front_default || officialArtwork,
          back: sprites.back_shiny
        };

        // FALLBACK: If back is missing, you could use official artwork for the front
        if (!sprites.back_default) {
          console.log("No back sprite found for this Pokemon.");
          // Optional: currentSpriteURL.front = sprites.other['official-artwork'].front_default;
        }
      updateImages();

      // 3. Types next to name
      const dataTypes = data.types;
      pokeTypeOne.textContent = capitalize(dataTypes[0].type.name);
      mainScreen.classList.add(dataTypes[0].type.name);

      if (dataTypes[1]) {
        pokeTypeTwo.classList.remove('hide');
        pokeTypeTwo.textContent = capitalize(dataTypes[1].type.name);
      } else {
        pokeTypeTwo.classList.add('hide');
      }
      // 3.5 Update Stats Progress Bars
      const stats = data.stats;
      const statNameMap = {
        hp: 'hp',
        atk: 'attack',
        def: 'defense',
        spe: 'speed',
        spa: 'special-attack',
        spd: 'special-defense'
      };

      const setBarColor = (barElement, value) => {
        barElement.classList.remove('bar-low', 'bar-medium', 'bar-high');
        if (value < 60) {
          barElement.classList.add('bar-low');
        } else if (value < 100) {
          barElement.classList.add('bar-medium');
        } else {
          barElement.classList.add('bar-high');
        }
      };

      // First: Set all bars to 0% immediately so they are "ready" to animate
      Object.keys(statBars).forEach(key => {
        statBars[key].style.width = '0%';
      });

      // Second: Use a small timeout to trigger the CSS transition
      setTimeout(() => {
        Object.keys(statBars).forEach(key => {
          const statData = stats.find(s => s.stat.name === statNameMap[key]);
          const value = statData.base_stat;
          const bar = statBars[key];
          
          // Update the width and the color class
          bar.style.width = `${(value / 255) * 100}%`;
          setBarColor(bar, value);
          
          // Update the text labels
          statLabels[key].textContent = `${key.toUpperCase()}: ${value}`;
        });
      }, 50);
      

      // 4. Audio Cry
      if (data.cries && pokeAudio) {
        pokeAudio.src = data.cries.latest || data.cries.legacy;
        pokeAudio.load();
      }

      // 5. Fetch Description (Second API Call)
     return fetch(data.species.url).then(res => res.json()).then(speciesData => ({
        speciesData,
        originalData: data
      }));
    })
    .then(({ speciesData, originalData }) => {
      // Update forms using the passed originalData
      availableForms = speciesData.varieties; 
      currentFormIndex = availableForms.findIndex(v => v.pokemon.name === originalData.name);
      
      const englishEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
      if (pokeDescription) {
        pokeDescription.textContent = englishEntry 
          ? englishEntry.flavor_text.replace(/[\f\n\r]/g, ' ') 
          : "No description available.";
      }
      mainScreen.classList.add('has-data');
    })
    .catch(err => {
      console.error("Error:", err);
      mainScreen.classList.remove('has-data');
    });
};

// Fetch List for Right Screen
const fetchPokeList = url => {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const { results, previous, next } = data;
      prevUrl = previous;
      nextUrl = next;

      for (let i = 0; i < pokeListItems.length ; i++) {
        const pokeListItem = pokeListItems[i];
        const resultData = results[i];

        if (resultData) {
          const { name, url } = resultData;
          const urlArray = url.split('/');
          const id = urlArray[urlArray.length - 2];
          pokeListItem.textContent = id + '. ' + capitalize(name);
        } else {
          pokeListItem.textContent = '';
        }
      }
    });
};
const handleFormChange = () => {
  if (availableForms.length <= 1) return;

  currentFormIndex = (currentFormIndex + 1) % availableForms.length;
  
  // Keep the raw name for the API fetch (it needs the dashes)
  const rawFormName = availableForms[currentFormIndex].pokemon.name;
  
  // Fetch using the raw name
  fetchPokeData(rawFormName);
};
formBtn.addEventListener('click', handleFormChange);

// Event Listeners
const handleSearch = () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    // This allows searching by ID or Name
    fetchPokeData(searchTerm); 
    searchInput.value = '';
  }
};

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

cryBtn.addEventListener('click', () => {
  if (pokeAudio && pokeAudio.src) {
    pokeAudio.currentTime = 0; // Reset to start
    pokeAudio.play().catch(e => console.log("Audio blocked"));
  }
});

shinyCB.addEventListener('change', updateImages);

leftButton.addEventListener('click', () => {
  if (prevUrl) fetchPokeList(prevUrl);
});

rightButton.addEventListener('click', () => {
  if (nextUrl) fetchPokeList(nextUrl);
});

for (const pokeListItem of pokeListItems) {
  pokeListItem.addEventListener('click', (e) => {
    if (!e.target.textContent) return;
    const id = e.target.textContent.split('.')[0];
    fetchPokeData(id);
  });
}

document.querySelector('#minus-button')?.addEventListener('click', () => {
  if (ogIndex > 1) {
    const currentId = parseInt(pokeId.textContent.replace('#', '')) || ogIndex;
    fetchPokeData(currentId - 1);
  }
});

document.querySelector('#plus-button')?.addEventListener('click', () => {
  // Use the ID from the text display to ensure we increment the National Dex number
  const currentId = parseInt(pokeId.textContent.replace('#', '')) || ogIndex;
  if (currentId < 1025) { 
    fetchPokeData(currentId + 1);
  }
});

document.querySelector('#down-button')?.addEventListener('click', () => {
  const currentId = parseInt(pokeId.textContent.replace('#', '')) || ogIndex;
  if (currentId > 10) {
    fetchPokeData(currentId - 10);
  } else {
    fetchPokeData(1);
  }
});

document.querySelector('#up-button')?.addEventListener('click', () => {
  const currentId = parseInt(pokeId.textContent.replace('#', '')) || ogIndex;
  // Ensure we don't exceed the total count of 1025
  const nextId = currentId + 10;
  fetchPokeData(nextId > 1025 ? 1025 : nextId);
});
// Initialize
fetchPokeList('https://pokeapi.co/api/v2/pokemon?offset=0&limit=20');