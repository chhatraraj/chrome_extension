// background.js

let blockedSites = [];
let isBlocking = false;
let completedSessions = 0;
let totalFocusTime = 0;
let pomodoroDuration = 25; // in minutes
let breakDuration = 5; // in minutes

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        blockedSites: [],
        isBlocking: false,
        completedSessions: 0,
        totalFocusTime: 0
    });
    console.log("Productivity Booster Installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sessionComplete') {
        handleSessionComplete();
    } else if (request.action === 'updateBlockedSites') {
        blockedSites = request.sites;
    }
});

function handleSessionComplete() {
    isBlocking = false;
    chrome.storage.sync.get(['completedSessions', 'totalFocusTime'], (result) => {
        completedSessions = (result.completedSessions || 0) + 1;
        totalFocusTime = (result.totalFocusTime || 0) + 25; // Default 25 minutes
        
        chrome.storage.sync.set({
            completedSessions,
            totalFocusTime,
            isBlocking: false
        });
        
        showNotification(
            "Session Complete!",
            "Great job! Take a short break and stay hydrated.",
            "success"
        );
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "pomodoroEnd") {
        isBlocking = false;
        chrome.storage.sync.set({ isBlocking });
        alert("Pomodoro session ended! Take a break.");
    } else if (alarm.name === "breakEnd") {
        isBlocking = true;
        chrome.storage.sync.set({ isBlocking });
        alert("Break is over! Time to focus again.");
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (isBlocking && blockedSites.some(site => details.url.includes(site))) {
            showNotification(
                "Website Blocked",
                "This website is blocked during your focus session.",
                "warning"
            );
            return { cancel: true };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

function showNotification(title, message, type = 'info') {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: `icons/icon${type === 'success' ? '48' : '128'}.png`,
        title: title,
        message: message,
        priority: 2
    });
}

chrome.storage.sync.get([
    'blockedSites',
    'isBlocking',
    'completedSessions',
    'totalFocusTime'
], (result) => {
    blockedSites = result.blockedSites || [];
    isBlocking = result.isBlocking || false;
    completedSessions = result.completedSessions || 0;
    totalFocusTime = result.totalFocusTime || 0;
});
