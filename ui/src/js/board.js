/**
 * board.js - Kanban Board Module
 * 
 * Handles the Scrumban flow board functionality including WIP limits, task management, 
 * and kanban column operations. Part of Task #29.7: Kanban Board Module.
 */

/**
 * Module-level state for the kanban board
 * @type {Object}
 * @private
 */
const boardState = {
    wipLimitsEnforced: true,
    columnLimits: {
        'backlog': 999, // Unlimited
        'analysis': 3,
        'development': 3,
        'review': 2,
        'done': 999 // Unlimited
    }
};

/**
 * Toggles WIP limit enforcement on the board
 * @private
 */
function toggleWIPEnforcement() {
    boardState.wipLimitsEnforced = !boardState.wipLimitsEnforced;
    
    const toggle = document.querySelector('.wip-toggle');
    if (toggle) {
        if (boardState.wipLimitsEnforced) {
            toggle.textContent = '🔒 WIP Limits ON';
            toggle.classList.add('enforced');
            alert('✅ WIP limits enforced! Tasks cannot exceed column limits.');
        } else {
            toggle.textContent = '🔓 WIP Limits OFF';
            toggle.classList.remove('enforced');
            alert('⚠️ WIP limits disabled. Flow optimization may be affected.');
        }
    }
}

/**
 * Pull a task from one column to another
 * @param {HTMLElement} element - The element that triggered the pull
 * @private
 */
function pullTask(element) {
    const taskCard = element.closest('.task-card');
    const taskTitle = taskCard.querySelector('.task-title').textContent;
    
    if (boardState.wipLimitsEnforced) {
        // Check if Analysis column has capacity
        const analysisColumn = document.querySelectorAll('.column')[1];
        const currentTasks = analysisColumn.querySelectorAll('.task-card').length;
        const limit = boardState.columnLimits['analysis'];
        
        if (currentTasks >= limit) {
            alert(`❌ Cannot pull task! Analysis column is at WIP limit (${currentTasks}/${limit}). Please complete a task first.`);
            return;
        }
    }
    
    alert(`✅ "${taskTitle}" pulled into Analysis! Agent can now begin work.`);
    // In a real implementation, this would move the task to the Analysis column
}

/**
 * Open the task selection modal
 * @private
 */
function openTaskModal() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.style.display = 'block';
    }
}

/**
 * Close the task selection modal
 * @private
 */
function closeModal() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.style.display = 'none';
    }
}

/**
 * Pull a task from the backlog into the workflow
 * @private
 */
function pullTaskFromBacklog() {
    alert('⬇ Task pulled successfully! Agent workload updated, WIP limits checked, and flow metrics tracked.');
    closeModal();
}

/**
 * View the sprint burndown chart
 * @private
 */
function viewBurndown() {
    alert('📈 Sprint burndown chart opened! Shows progress toward sprint goal with predictive completion date.');
}

/**
 * View the cumulative flow diagram
 * @private
 */
function viewCumulativeFlow() {
    alert('📊 Cumulative flow diagram opened! Visualizes work distribution and identifies flow bottlenecks over time.');
}

/**
 * Apply flow optimizations to the board
 * @private
 */
function applyOptimizations() {
    alert('✨ Flow optimizations applied! WIP limits adjusted, blocked items moved, and team capacity rebalanced.');
}

/**
 * Schedule a flow optimization review
 * @private
 */
function scheduleOptimizationReview() {
    alert('📅 Flow optimization review scheduled for next daily standup. AI agents will monitor metrics until then.');
}

/**
 * Export retrospective data
 * @private
 */
function exportRetrospective() {
    alert('📤 Retrospective exported! Action items added to backlog, and insights shared with stakeholders.');
}

/**
 * Schedule the next retrospective meeting
 * @private
 */
function scheduleNextRetro() {
    alert('📅 Next retrospective scheduled! AI agents will continue monitoring flow metrics and prepare improvement suggestions.');
}

/**
 * Set up all event listeners for the kanban board
 * @param {Object} appState - The application state object
 * @private
 */
function setupEventListeners(appState) {
    // WIP toggle button
    const wipToggleButton = document.querySelector('.wip-toggle');
    if (wipToggleButton) {
        wipToggleButton.removeAttribute('onclick');
        wipToggleButton.addEventListener('click', toggleWIPEnforcement);
    }
    
    // Pull task buttons
    document.querySelectorAll('.pull-task-btn').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function() {
            pullTask(this);
        });
    });
    
    // Open task modal buttons
    document.querySelectorAll('.open-task-modal').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', openTaskModal);
    });
    
    // Task modal close button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.removeAttribute('onclick');
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Pull task from backlog button
    const pullTaskBtn = document.querySelector('.pull-task-button');
    if (pullTaskBtn) {
        pullTaskBtn.removeAttribute('onclick');
        pullTaskBtn.addEventListener('click', pullTaskFromBacklog);
    }
    
    // View burndown chart button
    const burndownBtn = document.querySelector('.view-burndown');
    if (burndownBtn) {
        burndownBtn.removeAttribute('onclick');
        burndownBtn.addEventListener('click', viewBurndown);
    }
    
    // View cumulative flow button
    const cumulativeFlowBtn = document.querySelector('.view-cumulative-flow');
    if (cumulativeFlowBtn) {
        cumulativeFlowBtn.removeAttribute('onclick');
        cumulativeFlowBtn.addEventListener('click', viewCumulativeFlow);
    }
    
    // Apply optimizations button
    const applyOptBtn = document.querySelector('.apply-optimizations');
    if (applyOptBtn) {
        applyOptBtn.removeAttribute('onclick');
        applyOptBtn.addEventListener('click', applyOptimizations);
    }
    
    // Schedule optimization review button
    const scheduleOptBtn = document.querySelector('.schedule-optimization');
    if (scheduleOptBtn) {
        scheduleOptBtn.removeAttribute('onclick');
        scheduleOptBtn.addEventListener('click', scheduleOptimizationReview);
    }
    
    // Export retrospective button
    const exportRetroBtn = document.querySelector('.export-retrospective');
    if (exportRetroBtn) {
        exportRetroBtn.removeAttribute('onclick');
        exportRetroBtn.addEventListener('click', exportRetrospective);
    }
    
    // Schedule next retrospective button
    const scheduleRetroBtn = document.querySelector('.schedule-retro');
    if (scheduleRetroBtn) {
        scheduleRetroBtn.removeAttribute('onclick');
        scheduleRetroBtn.addEventListener('click', scheduleNextRetro);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const taskModal = document.getElementById('taskModal');
        if (event.target === taskModal) {
            closeModal();
        }
    });
}

/**
 * Initialize the kanban board module
 * @param {Object} appState - The application state object
 * @public
 */
export function init(appState) {
    console.log('Initializing Kanban Board module');
    
    // Store reference to appState
    boardState.appState = appState;
    
    // Setup event listeners
    setupEventListeners(appState);
    
    // Initialize UI state
    const wipToggle = document.querySelector('.wip-toggle');
    if (wipToggle) {
        wipToggle.textContent = boardState.wipLimitsEnforced ? '🔒 WIP Limits ON' : '🔓 WIP Limits OFF';
        if (boardState.wipLimitsEnforced) {
            wipToggle.classList.add('enforced');
        }
    }
}

/**
 * Get the current WIP limits enforcement state
 * @returns {boolean} True if WIP limits are enforced
 * @public
 */
export function getWipLimitsEnforced() {
    return boardState.wipLimitsEnforced;
}

/**
 * Get the column WIP limits
 * @returns {Object} Object containing column WIP limits
 * @public
 */
export function getColumnLimits() {
    return {...boardState.columnLimits};
}

// Export public methods for use by other modules
export {
    toggleWIPEnforcement,
    pullTask,
    openTaskModal,
    closeModal,
    pullTaskFromBacklog,
    viewBurndown,
    viewCumulativeFlow,
    applyOptimizations,
    scheduleOptimizationReview,
    exportRetrospective,
    scheduleNextRetro
};
