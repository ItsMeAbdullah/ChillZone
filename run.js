// index.js
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Paths to your bot files
const welcomePath = path.join(__dirname, 'welcome.js');
const slashPath = path.join(__dirname, 'slash.js');

// Function to run a child process
function runBot(file) {
    const bot = spawn('node', [file], { stdio: 'inherit' });
    bot.on('close', (code) => {
        console.log(`${file} exited with code ${code}. Restarting...`);
        setTimeout(() => runBot(file), 3000); // Restart after 3 sec
    });
}

// Start both bots
runBot(welcomePath);
runBot(slashPath);
