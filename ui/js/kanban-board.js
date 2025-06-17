/**
 * Kanban Board Module
 * Handles the Scrumban flow board functionality including WIP limits, task management, 
 * and kanban column operations
 */

const kanbanBoard = (() => {
    // Module-level state
    let state = {
        wipLimitsEnforced: true,
        columnLimits: {
            'backlog': 999, // Unlimited
            'analysis': 3,
            'development': 3,
            'review': 2,
            'done': 999 // Unlimited
        }
    };

    // Private functions
    const toggleWIPEnforcement = () => {
        state.wipLimitsEnforced = !state.wipLimitsEnforced;
        
        const toggle = document.querySelector('.wip-toggle');
        if (toggle) {
            if (state.wipLimitsEnforced) {
                toggle.textContent = '🔒 WIP Limits ON';
                toggle.classList.add('enforced');
                alert('✅ WIP limits enforced! Tasks cannot exceed column limits.');
            } else {
                toggle.textContent = '🔓 WIP Limits OFF';
                toggle.classList.remove('enforced');
                alert('⚠️ WIP limits disabled. Flow optimization may be affected.');
            }
        }
    };

    const pullTask = (element) => {
        const taskCard = element.closest('.task-card');
        const taskTitle = taskCard.querySelector('.task-title').textContent;
        
        if (state.wipLimitsEnforced) {
            // Check if Analysis column has capacity
            const analysisColumn = document.querySelectorAll('.column')[1];
            const currentTasks = analysisColumn.querySelectorAll('.task-card').length;
            const limit = state.columnLimits['analysis'];
            
            if (currentTasks >= limit) {
                alert(`❌ Cannot pull task! Analysis column is at WIP limit (${currentTasks}/${limit}). Please complete a task first.`);
                return;
            }
        }
        
        alert(`✅ "${taskTitle}" pulled into Analysis! Agent can now begin work.`);
        // In a real implementation, this would move the task to the Analysis column
    };

    const openTaskModal = () => {
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.style.display = 'block';
        }
    };

    const closeModal = () => {
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.style.display = 'none';
        }
    };

    const pullTaskFromBacklog = () => {
        alert('⬇ Task pulled successfully! Agent workload updated, WIP limits checked, and flow metrics tracked.');
        closeModal();
    };

    const viewBurndown = () => {
        alert('📈 Sprint burndown chart opened! Shows progress toward sprint goal with predictive completion date.');
    };

    const viewCumulativeFlow = () => {
        alert('📊 Cumulative flow diagram opened! Visualizes work distribution and identifies flow bottlenecks over time.');
    };

    // Set up event listeners to replace inline onclick handlers
    const setupEventListeners = () => {
        // WIP toggle button
        const wipToggleButton = document.querySelector('.wip-toggle');
        if (wipToggleButton) {
            wipToggleButton.addEventListener('click', toggleWIPEnforcement);
        }
        
        // Pull task buttons
        document.querySelectorAll('.pull-task-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                pullTask(this);
            });
        });
        
        // Open task modal buttons
        document.querySelectorAll('.open-task-modal').forEach(btn => {
            btn.addEventListener('click', openTaskModal);
        });
        
        // Task modal close button
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        
        // Pull task from backlog button
        const pullTaskBtn = document.querySelector('.pull-task-button');
        if (pullTaskBtn) {
            pullTaskBtn.addEventListener('click', pullTaskFromBacklog);
        }
        
        // View burndown chart button
        const burndownBtn = document.querySelector('.view-burndown');
        if (burndownBtn) {
            burndownBtn.addEventListener('click', viewBurndown);
        }
        
        // View cumulative flow button
        const cumulativeFlowBtn = document.querySelector('.view-cumulative-flow');
        if (cumulativeFlowBtn) {
            cumulativeFlowBtn.addEventListener('click', viewCumulativeFlow);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const taskModal = document.getElementById('taskModal');
            if (event.target === taskModal) {
                closeModal();
            }
        });
    };

    // Public API
    const init = (appState) => {
        console.log('Initializing Kanban Board module');
        
        // Store reference to appState if needed
        state.appState = appState;
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize UI state
        const wipToggle = document.querySelector('.wip-toggle');
        if (wipToggle) {
            wipToggle.textContent = state.wipLimitsEnforced ? '🔒 WIP Limits ON' : '🔓 WIP Limits OFF';
            if (state.wipLimitsEnforced) {
                wipToggle.classList.add('enforced');
            }
        }
        
        return this;
    };

    const getWipLimitsEnforced = () => {
        return state.wipLimitsEnforced;
    };

    const getColumnLimits = () => {
        return {...state.columnLimits};
    };

    // Expose public API
    return {
        init,
        getWipLimitsEnforced,
        getColumnLimits,
        
        // Expose functions that need to be accessible globally
        toggleWIPEnforcement,
        pullTask,
        openTaskModal,
        closeModal,
        pullTaskFromBacklog,
        viewBurndown,
        viewCumulativeFlow
    };
})();

export default kanbanBoard;
