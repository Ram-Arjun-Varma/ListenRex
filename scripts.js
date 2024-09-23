//Game Asssets
const dinoImage = document.getElementById("dino");
const cactusImage = document.getElementById("cactus");

// Set up canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const restartButton = document.getElementById('restartButton');

// Dino character settings
let dino = {
    x: 50,
    y: 200,
    width: 40,
    height: 40,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -12,
    isJumping: false
};
// Obstacle settings
let obstacles = [];
let obstacleSpeed = 5;
let obstacleFrequencyRange = { min: 2000, max: 6000 };  // Random interval range (2 to 6 seconds)
let nextObstacleTime = 0;
let gameOver = false;

// Game settings
let score = 0;
let lastObstacleSpawnTime = 0;

// Function to get a random obstacle interval between the min and max values
function getRandomObstacleInterval() {
    const min = obstacleFrequencyRange.min;
    const max = obstacleFrequencyRange.max;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Load TensorFlow.js Speech Commands model
let recognizer;
async function loadSpeechModel() {
    recognizer = speechCommands.create('BROWSER_FFT', 'directional4w');
    await recognizer.ensureModelLoaded();

    // Listen for speech commands
    recognizer.listen(result => {
        const scores = result.scores;  // Array of probability scores for each command
        const words = recognizer.wordLabels();  // List of possible commands
        const highestScore = Math.max(...scores);
        const predictedWord = words[scores.indexOf(highestScore)];
        console.log(predictedWord);
        if (predictedWord === 'up') {
            jump();
        }
    }, { probabilityThreshold: 0.8 });
}


// Dino jump logic
function jump() {
    if (!dino.isJumping) {
        dino.velocityY = dino.jumpPower;
        dino.isJumping = true; 
    }
}

// Update dino's position based on gravity
function updateDino() {
    dino.velocityY += dino.gravity;
    dino.y += dino.velocityY;

    // Check if the dino is at or below ground level (y = 150 is ground)
    if (dino.y >= 150) {
        dino.y = 150;            // Correct the y position to be on the ground
        dino.velocityY = 0;       // Reset vertical velocity
        dino.isJumping = false;   // Allow jumping again after landing
    }
}

// Create new obstacles
function createObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 170,
        width: 20,
        height: 20
    });
}

// Update obstacle positions and check for collisions
function updateObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= obstacleSpeed;

        // Check for collision
        if (
            obstacles[i].x < dino.x + dino.width &&
            obstacles[i].x + obstacles[i].width > dino.x &&
            obstacles[i].y < dino.y + dino.height &&
            obstacles[i].y + obstacles[i].height > dino.y
        ) {
            gameOver = true;
        }
    }

    // Remove off-screen obstacles
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
}

// Draw dino and obstacles
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dino
    ctx.drawImage(dinoImage, dino.x, dino.y, dino.width, dino.height);

    // Draw obstacles
    for (let i = 0; i < obstacles.length; i++) {
        ctx.drawImage(cactusImage, obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
    }

    // Draw score
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

// Main game loop
function gameLoop(timestamp) {
    if (gameOver) {
        ctx.font = '40px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
        recognizer.stopListening();
        restartButton.style.display = 'inline';  // Show restart button
        return;
    }

    updateDino();
    updateObstacles();
    drawGame();

    // Increase score
    score++;

    // Check if it's time to spawn a new obstacle
    if (timestamp - lastObstacleSpawnTime > nextObstacleTime) {
        createObstacle();
        lastObstacleSpawnTime = timestamp;
        nextObstacleTime = getRandomObstacleInterval();  // Get a new random interval for the next obstacle
    }

    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    playButton.style.display = 'none';  // Hide play button
    restartButton.style.display = 'none';  // Hide restart button
    nextObstacleTime = getRandomObstacleInterval();  // Set the first random obstacle interval
    loadSpeechModel().then(() => {
        requestAnimationFrame(gameLoop);
    });
}

// Reset the game state to start over
function restartGame() {
    gameOver = false;
    dino = { x: 50, y: 150, width: 40, height: 40, velocityY: 0, gravity: 0.8, jumpPower: -12, isJumping: false };
    obstacles = [];
    score = 0;
    lastObstacleSpawnTime = 0;
    nextObstacleTime = getRandomObstacleInterval();  // Reset to a new random interval for the obstacle
    startGame();  // Restart the game loop
}

// Initialize the game (hide buttons until user interaction)
playButton.style.display = 'inline';  // Show play button initially
restartButton.style.display = 'none';  // Hide restart button until game ends