/**
 * sprint-planning.js - Sprint Planning Module
 * 
 * This module handles all sprint planning functionality for the Scrumban AI Development Dashboard.
 * It manages story selection, capacity management, dependencies, and sprint actions.
 * 
 * Part of Task #29: Separate JavaScript Logic into Modules
 */

// Module state
let appState = null;
const sprintState = {
    totalCapacity: 78,
    selectedPoints: 0,
    selectedStories: 0
};

/**
 * Initialize the sprint planning module
 * @param {Object} state - Global application state
 */
export function init(state) {
    appState = state;
    console.log('Sprint planning module initialized');
    
    // Set up event listeners for sprint planning elements
    setupSprintPlanningEventListeners();
    
    // Initialize capacity bars
    updateCapacityBars(0);
}

/**
 * Set up event listeners for sprint planning elements
 */
function setupSprintPlanningEventListeners() {
    // Set up event listeners for story items
    document.querySelectorAll('.story-item').forEach(story => {
        story.addEventListener('click', function() {
            toggleStorySelection(this);
        });
    });
    
    // Set up event listeners for dependency icons
    document.querySelectorAll('.dependency-icon').forEach(icon => {
        if (icon.getAttribute('onclick')) {
            const element = icon;
            icon.removeAttribute('onclick');
            icon.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the story selection
                showDependencies(this);
            });
        }
    });
    
    // Set up event listener for commit sprint button
    const commitButton = document.querySelector('button[onclick="commitSprint()"]');
    if (commitButton) {
        commitButton.removeAttribute('onclick');
        commitButton.addEventListener('click', commitSprint);
    }
    
    // Set up event listener for run simulation button
    const simulationButton = document.querySelector('button[onclick="runSprintSimulation()"]');
    if (simulationButton) {
        simulationButton.removeAttribute('onclick');
        simulationButton.addEventListener('click', runSprintSimulation);
    }
    
    // Set up event listener for save draft button
    const saveButton = document.querySelector('button[onclick="saveSprintDraft()"]');
    if (saveButton) {
        saveButton.removeAttribute('onclick');
        saveButton.addEventListener('click', saveSprintDraft);
    }
}

/**
 * Toggle story selection state
 * @param {HTMLElement} element - The story item element to toggle
 */
export function toggleStorySelection(element) {
    element.classList.toggle('selected');
    const checkbox = element.querySelector('.story-checkbox');
    const isSelected = element.classList.contains('selected');
    
    checkbox.textContent = isSelected ? '✓' : '☐';
    
    // Update selection count
    updateSelectionStats();
}

/**
 * Update the selection statistics in the UI
 */
export function updateSelectionStats() {
    const selectedStories = document.querySelectorAll('.story-item.selected');
    const totalPoints = Array.from(selectedStories).reduce((sum, story) => {
        const points = parseInt(story.querySelector('.story-points').textContent);
        return sum + points;
    }, 0);
    
    const countElement = document.querySelector('.selected-count');
    if (countElement) {
        countElement.textContent = `${selectedStories.length} selected (${totalPoints} SP)`;
    }
    
    // Update module state
    sprintState.selectedPoints = totalPoints;
    sprintState.selectedStories = selectedStories.length;
    
    // Update capacity bars
    updateCapacityBars(totalPoints);
}

/**
 * Update the capacity bars in the UI
 * @param {number} selectedPoints - The total story points selected
 */
export function updateCapacityBars(selectedPoints) {
    const committedElement = document.querySelector('.capacity-committed .capacity-number');
    const remainingElement = document.querySelector('.capacity-remaining .capacity-number');
    
    if (committedElement) {
        committedElement.textContent = selectedPoints;
    }
    if (remainingElement) {
        remainingElement.textContent = sprintState.totalCapacity - selectedPoints;
    }
}

/**
 * Show dependencies for a story
 * @param {HTMLElement} element - Element that triggered the dependency view
 */
export function showDependencies(element) {
    const storyItem = element.closest('.story-item');
    const storyTitle = storyItem.querySelector('.story-title').textContent;
    
    alert(`🔗 Dependencies for "${storyTitle}":\n\n` +
          `Dependencies:\n` +
          `• Database Schema Design (Ready)\n` +
          `• UI Framework Setup (Complete)\n` +
          `• External API Access (Blocked)\n\n` +
          `Dependents:\n` +
          `• Task Management UI\n` +
          `• Reporting Dashboard\n\n` +
          `Use the Dependency Manager for detailed view and management.`);
}

/**
 * Commit the sprint with selected stories
 */
export function commitSprint() {
    const selectedStories = document.querySelectorAll('.story-item.selected').length;
    const totalPoints = Array.from(document.querySelectorAll('.story-item.selected')).reduce((sum, story) => {
        const points = parseInt(story.querySelector('.story-points').textContent);
        return sum + points;
    }, 0);
    
    if (selectedStories === 0) {
        alert('❌ Cannot commit sprint! Please select at least one story.');
        return;
    }
    
    const blockedDeps = document.querySelectorAll('.dependency-item.blocked').length;
    if (blockedDeps > 0) {
        if (!confirm(`⚠️ Warning: ${blockedDeps} blocked dependencies detected!\n\nThis may impact sprint delivery. Continue with commitment?`)) {
            return;
        }
    }
    
    alert(`🚀 Sprint 3.3 committed successfully!\n\n` +
          `📋 ${selectedStories} stories (${totalPoints} SP)\n` +
          `👥 6 AI agents assigned\n` +
          `📅 Start: Dec 31, 2024\n` +
          `🎯 Goal: Complete core authentication system and establish ML training pipeline foundation\n\n` +
          `Sprint backlog created and ready for development workflow!`);
}

/**
 * Run a sprint simulation to predict outcomes
 */
export function runSprintSimulation() {
    alert('🎲 Running Monte Carlo simulation...\n\n' +
          'Based on historical velocity and current dependencies:\n\n' +
          '✅ 85% chance of completing core stories\n' +
          '⚠️ 60% chance of completing all selected stories\n' +
          '📊 Expected completion: 36-42 story points\n' +
          '🚨 Risk: External API dependency may cause 2-day delay\n\n' +
          'Recommendation: Consider reducing scope by 8 SP or addressing blocked dependencies.');
}

/**
 * Save the current sprint draft
 */
export function saveSprintDraft() {
    alert('💾 Sprint draft saved!\n\nYou can continue planning later or share with stakeholders for review.');
}

/**
 * Get the current sprint state
 * @returns {Object} Current sprint state
 */
export function getSprintState() {
    return { ...sprintState };
}

/**
 * Set the total capacity for the sprint
 * @param {number} capacity - New total capacity
 */
export function setTotalCapacity(capacity) {
    if (typeof capacity === 'number' && capacity > 0) {
        sprintState.totalCapacity = capacity;
        updateCapacityBars(sprintState.selectedPoints);
    }
}
