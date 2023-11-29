const API_BASE_URL = 'https://pokeapi.co/api/v2';
let playerRoster = [];
let cpuRoster = [];
let currentPlayerPokemonIndex = 0;
let currentCpuPokemonIndex = 0;
let playerPokemonCount = 3;
let cpuPokemonCount = 3;

const capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);

const saveGameState = () => {
    const gameState = { playerRoster, cpuRoster, currentPlayerPokemonIndex, currentCpuPokemonIndex, playerPokemonCount, cpuPokemonCount };
    localStorage.setItem('pokemonGameState', JSON.stringify(gameState));
};

const loadGameState = () => {
    const savedState = localStorage.getItem('pokemonGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        ({ playerRoster, cpuRoster, currentPlayerPokemonIndex, currentCpuPokemonIndex, playerPokemonCount, cpuPokemonCount } = gameState);
        document.querySelector('#setup-container').style.display = 'none';
        document.querySelector('#game-container').style.display = 'block';
        startBattle();
    } else {
        document.querySelector('#setup-container').style.display = 'block';
        document.querySelector('#game-container').style.display = 'none';
    }
};

const setupGame = () => {
    document.querySelector('#start-game').addEventListener('click', () => {
        playerPokemonCount = parseInt(document.querySelector('#player-pokemon-count').value, 10);
        cpuPokemonCount = parseInt(document.querySelector('#cpu-pokemon-count').value, 10);

        document.querySelector('#setup-container').style.display = 'none';
        document.querySelector('#game-container').style.display = 'block';

        initGame(playerPokemonCount, cpuPokemonCount);
    });
};

const fetchPokemon = async id => {
    try {
        const response = await fetch(`${API_BASE_URL}/pokemon/${id}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const fetchRandomPokemon = async () => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    return fetchPokemon(randomId);
};

const fetchRandomPokemons = async number => {
    return Promise.all(Array.from({ length: number }, fetchRandomPokemon));
};

const attack = (attacker, defender) => {
    const damage = Math.floor(Math.random() * 20) + 1;
    defender.stats[0].base_stat = Math.max(defender.stats[0].base_stat - damage, 0);
    return damage;
};

const updateBattleUI = (pokemon, isPlayer) => {
    const hpElementId = isPlayer ? '#player-pokemon-hp' : '#cpu-pokemon-hp';
    document.querySelector(hpElementId).innerText = pokemon.stats[0].base_stat;
};

const displayBattlefield = (playerPokemon, cpuPokemon) => {
    const gameContainer = document.querySelector('#game-container');
    gameContainer.innerHTML = `
        <div class="battlefield">
            <div class="pokemon player-pokemon">
                <h2>Player's Pokémon</h2>
                <img src="${playerPokemon.sprites.front_default}" alt="${capitalizeFirstLetter(playerPokemon.name)}">
                <h3>${capitalizeFirstLetter(playerPokemon.name)}</h3>
                <p>HP: <span id="player-pokemon-hp">${playerPokemon.stats[0].base_stat}</span></p>
            </div>
            <div class="pokemon cpu-pokemon">
                <h2>CPU's Pokémon</h2>
                <img src="${cpuPokemon.sprites.front_default}" alt="${capitalizeFirstLetter(cpuPokemon.name)}">
                <h3>${capitalizeFirstLetter(cpuPokemon.name)}</h3>
                <p>HP: <span id="cpu-pokemon-hp">${cpuPokemon.stats[0].base_stat}</span></p>
            </div>
        </div>
    `;
};

const displayMoves = pokemon => {
    const movesContainer = document.createElement('div');
    movesContainer.id = 'moves-container';
    pokemon.moves.slice(0, 4).forEach(move => {
        const moveButton = document.createElement('button');
        moveButton.innerText = move.move.name;
        moveButton.addEventListener('click', () => playerAttack(move.move.name, pokemon));
        movesContainer.appendChild(moveButton);
    });
    document.querySelector('#game-container').appendChild(movesContainer);
};

const playerAttack = (moveName, playerPokemon) => {
    const cpuPokemon = cpuRoster[currentCpuPokemonIndex];
    const damage = attack(playerPokemon, cpuPokemon);
    updateBattleUI(cpuPokemon, false);
    battleTurn(cpuPokemon, playerPokemon);
};

const displayBattleControls = () => {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'controls-container';
    document.querySelector('#game-container').appendChild(controlsContainer);
};

const battleTurn = async (cpuPokemon, playerPokemon) => {
    const damage = attack(cpuPokemon, playerPokemon);
    updateBattleUI(playerPokemon, true);
    checkForFaintedPokemon();
    saveGameState();
};

const checkForFaintedPokemon = () => {
    if (playerRoster[currentPlayerPokemonIndex].stats[0].base_stat <= 0) {
        if (currentPlayerPokemonIndex < playerRoster.length - 1) {
            currentPlayerPokemonIndex++;
            startBattle();
        } else {
            endGame(false);
        }
    }

    if (cpuRoster[currentCpuPokemonIndex].stats[0].base_stat <= 0) {
        if (currentCpuPokemonIndex < cpuRoster.length - 1) {
            currentCpuPokemonIndex++;
            startBattle();
        } else {
            endGame(true);
        }
    }
};

const startBattle = () => {
    displayBattlefield(playerRoster[currentPlayerPokemonIndex], cpuRoster[currentCpuPokemonIndex]);
    displayMoves(playerRoster[currentPlayerPokemonIndex]);
    displayBattleControls();
};

const endGame = playerWon => {
    const gameContainer = document.querySelector('#game-container');
    const setupContainer = document.querySelector('#setup-container');

    gameContainer.innerHTML = `<h1>${playerWon ? 'You Win!' : 'You Lose!'}</h1>`;

    const replayButton = document.createElement('button');
    replayButton.textContent = 'Replay';
    replayButton.addEventListener('click', () => {
        setupContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        gameContainer.innerHTML = '';
    });

    gameContainer.appendChild(replayButton);
};

const initGame = async (playerCount, cpuCount) => {
    try {
        playerRoster = await fetchRandomPokemons(playerCount);
        cpuRoster = await fetchRandomPokemons(cpuCount);
        currentPlayerPokemonIndex = 0;
        currentCpuPokemonIndex = 0;
        startBattle();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
    saveGameState();
};

const setupRestartGameButton = () => {
    document.querySelector('#restart-game').addEventListener('click', () => {
        playerRoster = [];
        cpuRoster = [];
        currentPlayerPokemonIndex = 0;
        currentCpuPokemonIndex = 0;
        playerPokemonCount = 3;
        cpuPokemonCount = 3;

        localStorage.removeItem('pokemonGameState');

        document.querySelector('#setup-container').style.display = 'block';
        document.querySelector('#game-container').style.display = 'none';
    });
};

document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    setupGame();
    setupRestartGameButton();
});