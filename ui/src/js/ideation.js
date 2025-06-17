/**
 * ideation.js - Ideation Module
 * 
 * This module handles all ideation functionality for the Scrumban AI Development Dashboard.
 * It manages sticky notes, AI agent collaboration, voting, and ideation session management.
 * 
 * Part of Task #29: Separate JavaScript Logic into Modules
 */

// Module state
let appState = null;
const ideationState = {
    activeAgents: [],
    votingEnabled: false,
    clusteringEnabled: false
};

// Module constants
const AGENT_TYPES = [
    'Business Analysis Agent',
    'Technical Architecture Agent', 
    'UX Research Agent',
    'Product Strategy Agent',
    'Data Science Agent'
];

/**
 * Initialize the ideation module
 * @param {Object} state - Global application state
 */
export function init(state) {
    appState = state;
    console.log('Ideation module initialized');
    
    // Set up event listeners for ideation-related elements
    setupIdeationEventListeners();
}

/**
 * Set up event listeners for ideation-related elements
 */
function setupIdeationEventListeners() {
    // Set up event listeners for adding sticky notes
    const featureButton = document.querySelector('button[onclick="addSticky(\'feature\')"]');
    if (featureButton) {
        featureButton.removeAttribute('onclick');
        featureButton.addEventListener('click', () => addSticky('feature'));
    }
    
    const userStoryButton = document.querySelector('button[onclick="addSticky(\'user-story\')"]');
    if (userStoryButton) {
        userStoryButton.removeAttribute('onclick');
        userStoryButton.addEventListener('click', () => addSticky('user-story'));
    }
    
    const goalButton = document.querySelector('button[onclick="addSticky(\'goal\')"]');
    if (goalButton) {
        goalButton.removeAttribute('onclick');
        goalButton.addEventListener('click', () => addSticky('goal'));
    }
    
    // Set up event listeners for session management
    const startSessionButton = document.querySelector('button[onclick="startSession()"]');
    if (startSessionButton) {
        startSessionButton.removeAttribute('onclick');
        startSessionButton.addEventListener('click', startSession);
    }
    
    const inviteAgentsButton = document.querySelector('button[onclick="inviteAIAgents()"]');
    if (inviteAgentsButton) {
        inviteAgentsButton.removeAttribute('onclick');
        inviteAgentsButton.addEventListener('click', inviteAIAgents);
    }
    
    const loadTemplateButton = document.querySelector('button[onclick="loadTemplate()"]');
    if (loadTemplateButton) {
        loadTemplateButton.removeAttribute('onclick');
        loadTemplateButton.addEventListener('click', loadTemplate);
    }
    
    // Set up event listeners for idea organization
    const enableVotingButton = document.querySelector('button[onclick="enableVoting()"]');
    if (enableVotingButton) {
        enableVotingButton.removeAttribute('onclick');
        enableVotingButton.addEventListener('click', enableVoting);
    }
    
    const groupStickiesButton = document.querySelector('button[onclick="groupStickies()"]');
    if (groupStickiesButton) {
        groupStickiesButton.removeAttribute('onclick');
        groupStickiesButton.addEventListener('click', groupStickies);
    }
    
    const exportBoardButton = document.querySelector('button[onclick="exportBoard()"]');
    if (exportBoardButton) {
        exportBoardButton.removeAttribute('onclick');
        exportBoardButton.addEventListener('click', exportBoard);
    }
    
    // Set up event listeners for AI agent modal
    const addAgentButton = document.querySelector('button[onclick="addAIAgent()"]');
    if (addAgentButton) {
        addAgentButton.removeAttribute('onclick');
        addAgentButton.addEventListener('click', addAIAgent);
    }
    
    const closeAgentModalButton = document.querySelector('button[onclick="closeAgentModal()"]');
    if (closeAgentModalButton) {
        closeAgentModalButton.removeAttribute('onclick');
        closeAgentModalButton.addEventListener('click', closeAgentModal);
    }
}

/**
 * Start a new AI-powered brainstorming session
 */
export function startSession() {
    alert('🚀 AI-powered brainstorming session started! All AI agents are now active and contributing ideas.');
}

/**
 * Open the modal to invite AI agents
 */
export function inviteAIAgents() {
    document.getElementById('agentModal').style.display = 'block';
}

/**
 * Load an AI agent collaboration template
 */
export function loadTemplate() {
    alert('📋 Loading AI agent collaboration template with specialized prompts for each agent type.');
}

/**
 * Alias for inviteAIAgents
 */
export function inviteAIAgent() {
    inviteAIAgents();
}

/**
 * Add an AI agent to the current session
 */
export function addAIAgent() {
    const agentType = document.getElementById('agentType').value;
    const agentFocus = document.getElementById('agentFocus').value;
    const agentName = document.getElementById('agentType').selectedOptions[0].text.split(' - ')[0];
    
    // Add to local state
    ideationState.activeAgents.push({
        type: agentType,
        name: agentName,
        focus: agentFocus
    });
    
    alert(`🤖 ${agentName} added to session!\nFocus: ${agentFocus}\nThe agent will now contribute specialized insights during brainstorming.`);
    closeAgentModal();
}

/**
 * Close the AI agent selection modal
 */
export function closeAgentModal() {
    document.getElementById('agentModal').style.display = 'none';
}

/**
 * Enable AI agent voting on ideas
 */
export function enableVoting() {
    ideationState.votingEnabled = true;
    alert('🗳️ AI agent voting enabled! Each agent will evaluate and vote on ideas based on their expertise. Results will be automatically weighted and tallied.');
}

/**
 * Group sticky notes using AI clustering
 */
export function groupStickies() {
    ideationState.clusteringEnabled = true;
    alert('🗂️ AI clustering activated! Machine learning algorithms will group related ideas and identify patterns across agent contributions.');
}

/**
 * Export the ideation board with all contributions
 */
export function exportBoard() {
    alert('📤 Ideation board with AI agent contributions exported as comprehensive report including agent rationales and voting patterns.');
}

/**
 * Add a sticky note to the ideation board
 * @param {string} type - Type of sticky note (feature, user-story, goal)
 */
export function addSticky(type) {
    const board = document.getElementById('ideationBoard');
    
    const content = prompt(`Enter your ${type.replace('-', ' ')}:`);
    if (content) {
        const randomAgent = AGENT_TYPES[Math.floor(Math.random() * AGENT_TYPES.length)];
        const randomVotes = Math.floor(Math.random() * 10) + 1;
        
        const sticky = document.createElement('div');
        sticky.className = `sticky-note ${type}`;
        sticky.innerHTML = `
            <div class="sticky-content">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}</strong><br>
                ${content}
            </div>
            <div class="sticky-meta">
                <span>by ${randomAgent}</span>
                <div class="vote-count">${randomVotes}</div>
            </div>
        `;
        board.appendChild(sticky);
        
        // Add drag functionality
        enableDragOnSticky(sticky);
        
        // Simulate AI agent response
        setTimeout(() => {
            alert(`🤖 ${randomAgent} has analyzed your input and suggests considering: "${
                type === 'feature' ? 'technical feasibility and user impact' : 
                type === 'user-story' ? 'acceptance criteria and edge cases' : 
                'measurable KPIs and timeline'
            }" for this ${type.replace('-', ' ')}.`);
        }, 1500);
    }
}

/**
 * Enable drag functionality on a sticky note
 * @param {HTMLElement} element - The sticky note element
 */
function enableDragOnSticky(element) {
    element.draggable = true;
    
    element.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'dragging-sticky');
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0);
    });
    
    element.addEventListener('dragend', function() {
        this.classList.remove('dragging');
    });
}

/**
 * Get the current ideation state
 * @returns {Object} Current ideation state
 */
export function getIdeationState() {
    return { ...ideationState };
}

/**
 * Get the list of active AI agents
 * @returns {Array} List of active AI agents
 */
export function getActiveAgents() {
    return [...ideationState.activeAgents];
}
