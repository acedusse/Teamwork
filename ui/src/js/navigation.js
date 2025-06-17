/**
 * navigation.js - Tab Navigation Module
 * 
 * This module handles all tab navigation functionality for the Scrumban AI Development Dashboard.
 * It manages tab switching and maintains tab state.
 * 
 * Part of Task #29: Separate JavaScript Logic into Modules
 */

// Module state
let appState = null;

/**
 * Initialize the navigation module
 * @param {Object} state - Global application state
 */
export function init(state) {
    appState = state;
    console.log('Navigation module initialized');
    
    // Set up event listeners for all tab navigation elements
    setupTabEventListeners();
}

/**
 * Set up event listeners for tab navigation
 * Uses data-tab attributes to identify which tab to switch to
 */
function setupTabEventListeners() {
    // Select all navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    
    // Add click event listeners to each tab
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Extract tab name from data-tab attribute
            const tabName = tab.getAttribute('data-tab');
            
            if (tabName) {
                // Switch to this tab
                switchTab(tabName);
            }
        });
    });
}

/**
 * Switch to the specified tab
 * @param {string} tabName - Name of the tab to switch to
 */
export function switchTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    const tabContent = document.getElementById(tabName + '-content');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Add active class to clicked tab
    const targetTab = Array.from(document.querySelectorAll('.nav-tab')).find(tab => {
        const tabText = tab.textContent.toLowerCase();
        return tabText.includes(tabName === 'board' ? 'scrumban' : 
               tabName === 'sprint' ? 'sprint planning' :
               tabName === 'collaborative' ? 'collaborative planning' : tabName);
    });
    
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Update application state
    if (appState) {
        appState.currentTab = tabName;
    }
}

/**
 * Get the currently active tab
 * @returns {string} Name of the currently active tab
 */
export function getCurrentTab() {
    return appState ? appState.currentTab : null;
}
