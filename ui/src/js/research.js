/**
 * research.js - Research Module
 * 
 * This module handles all research functionality for the Scrumban AI Development Dashboard.
 * It manages research tabs, data collection, competitive analysis, and research insights.
 * 
 * Part of Task #29: Separate JavaScript Logic into Modules
 */

// Module state
let appState = null;
const researchState = {
    currentResearchTab: 'market',
    researchFindings: [],
    competitiveAnalysis: {},
    userResearch: {}
};

// Module constants
const RESEARCH_TABS = [
    'market',
    'competitive',
    'user',
    'technical',
    'feasibility'
];

/**
 * Initialize the research module
 * @param {Object} state - Global application state
 */
export function init(state) {
    appState = state;
    console.log('Research module initialized');
    
    // Set up event listeners for research-related elements
    setupResearchEventListeners();
}

/**
 * Set up event listeners for research-related elements
 */
function setupResearchEventListeners() {
    // Research tab navigation
    const marketTabElem = document.querySelector('button[onclick="switchResearchTab(\'market\')"]');
    if (marketTabElem) {
        marketTabElem.removeAttribute('onclick');
        marketTabElem.addEventListener('click', () => switchResearchTab('market'));
    }
    
    const competitiveTabElem = document.querySelector('button[onclick="switchResearchTab(\'competitive\')"]');
    if (competitiveTabElem) {
        competitiveTabElem.removeAttribute('onclick');
        competitiveTabElem.addEventListener('click', () => switchResearchTab('competitive'));
    }
    
    const userTabElem = document.querySelector('button[onclick="switchResearchTab(\'user\')"]');
    if (userTabElem) {
        userTabElem.removeAttribute('onclick');
        userTabElem.addEventListener('click', () => switchResearchTab('user'));
    }
    
    const technicalTabElem = document.querySelector('button[onclick="switchResearchTab(\'technical\')"]');
    if (technicalTabElem) {
        technicalTabElem.removeAttribute('onclick');
        technicalTabElem.addEventListener('click', () => switchResearchTab('technical'));
    }
    
    const feasibilityTabElem = document.querySelector('button[onclick="switchResearchTab(\'feasibility\')"]');
    if (feasibilityTabElem) {
        feasibilityTabElem.removeAttribute('onclick');
        feasibilityTabElem.addEventListener('click', () => switchResearchTab('feasibility'));
    }
    
    // Research actions
    const addInsightElem = document.querySelector('button[onclick="addResearchInsight()"]');
    if (addInsightElem) {
        addInsightElem.removeAttribute('onclick');
        addInsightElem.addEventListener('click', addResearchInsight);
    }
    
    const analyzeCompetitionElem = document.querySelector('button[onclick="analyzeCompetition()"]');
    if (analyzeCompetitionElem) {
        analyzeCompetitionElem.removeAttribute('onclick');
        analyzeCompetitionElem.addEventListener('click', analyzeCompetition);
    }
    
    const generateUserPersonasElem = document.querySelector('button[onclick="generateUserPersonas()"]');
    if (generateUserPersonasElem) {
        generateUserPersonasElem.removeAttribute('onclick');
        generateUserPersonasElem.addEventListener('click', generateUserPersonas);
    }
    
    const conductTechAssessmentElem = document.querySelector('button[onclick="conductTechAssessment()"]');
    if (conductTechAssessmentElem) {
        conductTechAssessmentElem.removeAttribute('onclick');
        conductTechAssessmentElem.addEventListener('click', conductTechAssessment);
    }
    
    const runFeasibilityModelElem = document.querySelector('button[onclick="runFeasibilityModel()"]');
    if (runFeasibilityModelElem) {
        runFeasibilityModelElem.removeAttribute('onclick');
        runFeasibilityModelElem.addEventListener('click', runFeasibilityModel);
    }
    
    const exportResearchElem = document.querySelector('button[onclick="exportResearch()"]');
    if (exportResearchElem) {
        exportResearchElem.removeAttribute('onclick');
        exportResearchElem.addEventListener('click', exportResearch);
    }
}

/**
 * Switch between research tabs
 * @param {string} tabName - Name of the tab to switch to
 */
export function switchResearchTab(tabName) {
    if (!RESEARCH_TABS.includes(tabName)) {
        console.error(`Invalid research tab: ${tabName}`);
        return;
    }
    
    // Update state
    researchState.currentResearchTab = tabName;
    
    // Hide all research content
    document.querySelectorAll('.research-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all research tabs
    document.querySelectorAll('.research-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activate selected tab and content
    const tabContent = document.getElementById(`${tabName}-research-content`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    const tabButton = document.querySelector(`.research-tab[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    console.log(`Switched to research tab: ${tabName}`);
}

/**
 * Add a new research insight
 */
export function addResearchInsight() {
    const insight = prompt('Enter your research insight:');
    if (!insight) return;
    
    const category = researchState.currentResearchTab;
    const newInsight = {
        id: Date.now(),
        category,
        text: insight,
        date: new Date().toISOString(),
        source: 'manual'
    };
    
    // Add to state
    researchState.researchFindings.push(newInsight);
    
    // Update UI
    const insightsContainer = document.getElementById(`${category}-insights`);
    if (insightsContainer) {
        const insightElement = document.createElement('div');
        insightElement.className = 'research-insight';
        insightElement.innerHTML = `
            <h4>Insight #${researchState.researchFindings.length}</h4>
            <p>${insight}</p>
            <small>Added: ${new Date().toLocaleString()}</small>
        `;
        insightsContainer.appendChild(insightElement);
    }
    
    alert(`Research insight added to ${category} research!`);
}

/**
 * Analyze competition with AI assistance
 */
export function analyzeCompetition() {
    alert('🔍 AI-powered competitive analysis running. This will analyze market positioning, feature sets, pricing models, and market share for all identified competitors.');
    
    setTimeout(() => {
        researchState.competitiveAnalysis = {
            competitors: ['CompA', 'CompB', 'CompC'],
            strengthsWeaknesses: {
                CompA: {
                    strengths: ['Market leader', 'Strong brand recognition'],
                    weaknesses: ['Aging technology', 'Higher price point']
                },
                CompB: {
                    strengths: ['Innovative features', 'Growing rapidly'],
                    weaknesses: ['Limited market reach', 'Customer support issues']
                },
                CompC: {
                    strengths: ['Cost leader', 'Simple UX'],
                    weaknesses: ['Feature-limited', 'Small customer base']
                }
            },
            opportunities: [
                'Hybrid pricing model',
                'Integration-first approach',
                'Focus on underserved mid-market segment'
            ]
        };
        
        alert('✅ Competitive analysis complete! Results have been added to the research dashboard.');
    }, 1500);
}

/**
 * Generate user personas using AI
 */
export function generateUserPersonas() {
    alert('👤 AI-powered user persona generation initiated. This will create comprehensive user archetypes based on available user research data and market trends.');
    
    setTimeout(() => {
        researchState.userResearch.personas = [
            {
                name: 'Enterprise Emma',
                role: 'Enterprise IT Manager',
                goals: ['Reduce operational overhead', 'Improve security compliance'],
                painPoints: ['Complex integration needs', 'Strict corporate policies']
            },
            {
                name: 'Startup Sam',
                role: 'Startup Founder',
                goals: ['Quick time to market', 'Flexible scaling options'],
                painPoints: ['Limited budget', 'Needs to pivot quickly']
            },
            {
                name: 'Developer Dana',
                role: 'Software Engineer',
                goals: ['Clean API', 'Extensive documentation'],
                painPoints: ['Integration headaches', 'Unreliable services']
            }
        ];
        
        alert('✅ User personas generated! Three key user types have been identified and added to user research.');
    }, 1500);
}

/**
 * Conduct technical assessment of requirements
 */
export function conductTechAssessment() {
    alert('⚙️ Technical feasibility assessment running. This will evaluate technological constraints, required resources, and implementation complexity.');
    
    setTimeout(() => {
        alert('✅ Technical assessment complete! All current requirements are feasible within the estimated timeline with the proposed technology stack.');
    }, 1500);
}

/**
 * Run AI feasibility model for project analysis
 */
export function runFeasibilityModel() {
    alert('🧮 AI feasibility model running. This will simulate development scenarios and predict project outcomes based on current requirements and constraints.');
    
    setTimeout(() => {
        alert('✅ Feasibility model complete! 92% likelihood of project success with current parameters. Two high-risk features have been flagged for further review.');
    }, 2000);
}

/**
 * Export all research data
 */
export function exportResearch() {
    alert('📤 Exporting consolidated research report with all findings, competitive analysis, and user research.');
    
    setTimeout(() => {
        const dataStr = JSON.stringify(researchState, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'research-findings.json');
        linkElement.click();
        
        alert('✅ Research export complete!');
    }, 1000);
}

/**
 * Get the current research state
 * @returns {Object} Current research state
 */
export function getResearchState() {
    return { ...researchState };
}

/**
 * Get the current research tab
 * @returns {string} Current research tab
 */
export function getCurrentResearchTab() {
    return researchState.currentResearchTab;
}

/**
 * Get all research findings
 * @returns {Array} Research findings
 */
export function getResearchFindings() {
    return [...researchState.researchFindings];
}

/**
 * Get competitive analysis data
 * @returns {Object} Competitive analysis data
 */
export function getCompetitiveAnalysis() {
    return { ...researchState.competitiveAnalysis };
}

/**
 * Get user research data
 * @returns {Object} User research data
 */
export function getUserResearch() {
    return { ...researchState.userResearch };
}
