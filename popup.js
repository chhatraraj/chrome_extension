// popup.js

// DOM Elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('startPomodoro');
const stopButton = document.getElementById('stopPomodoro');
const blockedSitesInput = document.getElementById('blockedSites');
const addSiteButton = document.getElementById('addSite');
const blockedSitesList = document.getElementById('blockedSitesList');
const themeToggle = document.getElementById('themeToggle');
const completedSessionsDisplay = document.getElementById('completedSessions');
const totalFocusTimeDisplay = document.getElementById('totalFocusTime');
const quoteSection = document.getElementById('quoteSection');
const quoteText = document.getElementById('quoteText');

// State
let timer;
let timeLeft;
let isRunning = false;
let completedSessions = 0;
let totalFocusTime = 0;
let isDarkMode = false;

// Motivational quotes
const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "Focus on being productive instead of busy. - Tim Ferriss",
    "The future depends on what you do today. - Mahatma Gandhi",
    "It always seems impossible until it's done. - Nelson Mandela",
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt"
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateTheme();
    updateStats();
    showRandomQuote();
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    updateTheme();
    saveSettings();
});

function updateTheme() {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeToggle.innerHTML = `<span class="material-icons">${isDarkMode ? 'light_mode' : 'dark_mode'}</span>`;
}

// Timer Functions
startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    const duration = parseInt(document.getElementById('pomodoroDuration').value) * 60;
    timeLeft = duration;
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            completeSession();
        }
    }, 1000);
    
    startButton.disabled = true;
    stopButton.disabled = false;
}

function stopTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isRunning = false;
    startButton.disabled = false;
    stopButton.disabled = true;
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function completeSession() {
    clearInterval(timer);
    isRunning = false;
    completedSessions++;
    totalFocusTime += parseInt(document.getElementById('pomodoroDuration').value);
    
    updateStats();
    saveSettings();
    showRandomQuote();
    
    chrome.runtime.sendMessage({ action: 'sessionComplete' });
    startButton.disabled = false;
    stopButton.disabled = true;
}

// Blocked Sites Management
addSiteButton.addEventListener('click', addBlockedSite);

function addBlockedSite() {
    const site = blockedSitesInput.value.trim();
    if (!site) return;
    
    const sites = getBlockedSites();
    if (!sites.includes(site)) {
        sites.push(site);
        saveBlockedSites(sites);
        updateBlockedSitesList();
    }
    
    blockedSitesInput.value = '';
}

function updateBlockedSitesList() {
    const sites = getBlockedSites();
    blockedSitesList.innerHTML = sites.map(site => `
        <div class="site-item">
            <span>${site}</span>
            <button class="icon-button" onclick="removeSite('${site}')">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `).join('');
}

function removeSite(site) {
    const sites = getBlockedSites().filter(s => s !== site);
    saveBlockedSites(sites);
    updateBlockedSitesList();
}

// Statistics
function updateStats() {
    completedSessionsDisplay.textContent = completedSessions;
    totalFocusTimeDisplay.textContent = totalFocusTime;
}

// Quotes
function showRandomQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = randomQuote;
    quoteSection.classList.remove('hidden');
}

// Settings Management
function loadSettings() {
    chrome.storage.sync.get([
        'blockedSites',
        'completedSessions',
        'totalFocusTime',
        'isDarkMode'
    ], (result) => {
        if (result.blockedSites) {
            document.getElementById('blockedSites').value = result.blockedSites.join(', ');
        }
        if (result.completedSessions) {
            completedSessions = result.completedSessions;
        }
        if (result.totalFocusTime) {
            totalFocusTime = result.totalFocusTime;
        }
        if (result.isDarkMode !== undefined) {
            isDarkMode = result.isDarkMode;
        }
        
        updateBlockedSitesList();
        updateStats();
    });
}

function saveSettings() {
    chrome.storage.sync.set({
        completedSessions,
        totalFocusTime,
        isDarkMode
    });
}

function getBlockedSites() {
    const input = document.getElementById('blockedSites').value;
    return input.split(',').map(site => site.trim()).filter(site => site);
}

function saveBlockedSites(sites) {
    chrome.storage.sync.set({ blockedSites: sites });
    chrome.runtime.sendMessage({ action: 'updateBlockedSites', sites });
}
