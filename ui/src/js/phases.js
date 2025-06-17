/**
 * phases.js - Phase Management Module
 * 
 * This module handles all phase tracking functionality for the collaborative planning workflow.
 * It manages phase transitions, phase status updates, and progress tracking.
 * 
 * Part of Task #29: Separate JavaScript Logic into Modules
 */

// Module state
let appState = null;
let currentPhase = 3; // Default starting phase
let totalPhases = 7;  // Total number of phases in the workflow

/**
 * Initialize the phases module
 * @param {Object} state - Global application state
 */
export function init(state) {
    appState = state;
    console.log('Phase management module initialized');
    
    // Set up event listeners for phase-related elements
    setupPhaseEventListeners();
    
    // Initialize phase tracker display
    updatePhaseTracker();
}

/**
 * Set up event listeners for phase-related elements
 */
function setupPhaseEventListeners() {
    // Set up event listeners for phase steps
    document.querySelectorAll('.phase-step').forEach((step, index) => {
        // Remove inline event handlers
        const phaseNum = index + 1;
        if (step.getAttribute('onclick')) {
            step.removeAttribute('onclick');
        }
        
        // Add proper event listener
        step.addEventListener('click', () => setCurrentPhase(phaseNum));
    });
    
    // Set up event listener for "Complete Current Phase" button
    const completePhaseButton = document.querySelector('button[onclick="completePhase()"]');
    if (completePhaseButton) {
        completePhaseButton.removeAttribute('onclick');
        completePhaseButton.addEventListener('click', completePhase);
    }
    
    // Set up event listener for "Export Progress" button
    const exportButton = document.querySelector('button[onclick="exportProgress()"]');
    if (exportButton) {
        exportButton.removeAttribute('onclick');
        exportButton.addEventListener('click', exportProgress);
    }
}

/**
 * Set the current phase and update the UI
 * @param {number} phase - Phase number to set as current
 */
export function setCurrentPhase(phase) {
    if (phase >= 1 && phase <= totalPhases) {
        currentPhase = phase;
        updatePhaseTracker();
        console.log(`Current phase set to: ${phase}`);
    } else {
        console.error(`Invalid phase number: ${phase}. Must be between 1 and ${totalPhases}.`);
    }
}

/**
 * Update the phase tracker UI to reflect the current phase
 */
export function updatePhaseTracker() {
    const steps = document.querySelectorAll('.phase-step');
    
    steps.forEach((step, index) => {
        step.classList.remove('completed', 'current', 'upcoming');
        
        if (index + 1 < currentPhase) {
            step.classList.add('completed');
        } else if (index + 1 === currentPhase) {
            step.classList.add('current');
        } else {
            step.classList.add('upcoming');
        }
    });
}

/**
 * Complete the current phase and move to the next one
 */
export function completePhase() {
    if (currentPhase < totalPhases) {
        currentPhase++;
        updatePhaseTracker();
        alert(`Phase ${currentPhase - 1} completed! Moving to Phase ${currentPhase}.`);
        
        // Auto-transition to next planning stage when appropriate
        if (currentPhase === 6) {
            if (confirm('🎯 Ready to move to Bucket Planning?\n\nYour requirements are ready to be organized into time horizons.')) {
                // Use the navigation module to switch tabs
                // This will need to be imported or accessed through appState
                import('./navigation.js').then(navigation => {
                    navigation.switchTab('planning');
                });
            }
        }
    } else {
        alert('🎉 All planning phases completed! Ready to begin bucket planning and sprint organization.');
        if (confirm('🚀 Move to Bucket Planning?')) {
            import('./navigation.js').then(navigation => {
                navigation.switchTab('planning');
            });
        }
    }
}

/**
 * Export the current workflow progress
 */
export function exportProgress() {
    alert('📊 Workflow progress exported as timeline visualization and status report.');
}

/**
 * Get the current phase number
 * @returns {number} Current phase number
 */
export function getCurrentPhase() {
    return currentPhase;
}
