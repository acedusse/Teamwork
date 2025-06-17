import { useReducer, useCallback, useEffect, useState } from 'react';

// Action types for the reducer
const ACTION_TYPES = {
  SET_PHASE: 'SET_PHASE',
  COMPLETE_PHASE: 'COMPLETE_PHASE',
  ADD_IDEA: 'ADD_IDEA',
  UPDATE_IDEA: 'UPDATE_IDEA',
  DELETE_IDEA: 'DELETE_IDEA',
  VOTE_IDEA: 'VOTE_IDEA',
  GROUP_IDEAS: 'GROUP_IDEAS',
  SET_VOTING_ENABLED: 'SET_VOTING_ENABLED',
  UPDATE_SESSION: 'UPDATE_SESSION',
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  UPDATE_PARTICIPANT_STATUS: 'UPDATE_PARTICIPANT_STATUS',
  SET_RESEARCH_TAB: 'SET_RESEARCH_TAB',
  ADD_RESEARCH_FINDING: 'ADD_RESEARCH_FINDING',
  UPDATE_DOCUMENT_PROGRESS: 'UPDATE_DOCUMENT_PROGRESS',
  RESET_STATE: 'RESET_STATE',
  LOAD_STATE: 'LOAD_STATE',
};

// Initial state
const initialState = {
  // Phase management
  currentPhase: 3,
  phases: [
    { id: 1, label: 'Discovery &\nVision', name: 'Discovery & Vision', completed: true },
    { id: 2, label: 'Stakeholder\nAlignment', name: 'Stakeholder Alignment', completed: true },
    { id: 3, label: 'Feature\nExploration', name: 'Feature Exploration', completed: false },
    { id: 4, label: 'User Story\nDevelopment', name: 'User Story Development', completed: false },
    { id: 5, label: 'Business Case\nDevelopment', name: 'Business Case Development', completed: false },
    { id: 6, label: 'Technical\nRequirements', name: 'Technical Requirements', completed: false },
    { id: 7, label: 'Validation &\nFinalization', name: 'Validation & Finalization', completed: false },
  ],
  
  // Session management
  session: {
    name: 'Feature Brainstorming - Q2 2025',
    duration: '90 minutes',
    focusArea: 'Core Features',
    isActive: false,
    startTime: null,
    endTime: null,
  },
  
  // Ideas management
  ideas: [
    {
      id: 1,
      type: 'feature',
      title: 'AI-Powered Code Generation',
      content: 'Automatically generate boilerplate code based on user specifications',
      author: 'Product Strategy Agent',
      votes: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['ai', 'automation'],
      group: null,
    },
    {
      id: 2,
      type: 'user-story',
      title: 'As a developer',
      content: 'I want to upload project requirements and get generated code templates so that I can start development faster',
      author: 'Business Analysis Agent',
      votes: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['user-story', 'requirements'],
      group: null,
    },
    {
      id: 3,
      type: 'business-goal',
      title: 'Reduce Time-to-Market',
      content: 'Decrease development time by 40% through automation and AI assistance',
      author: 'UX Research Agent',
      votes: 9,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['business', 'efficiency'],
      group: null,
    },
    {
      id: 4,
      type: 'feature',
      title: 'Real-time Collaboration',
      content: 'Multiple developers can work on the same codebase simultaneously with conflict resolution',
      author: 'Technical Architecture Agent',
      votes: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['collaboration', 'real-time'],
      group: null,
    },
  ],
  
  // Voting and interaction
  votingEnabled: false,
  ideaGroups: [],
  
  // Participants management
  participants: [
    { 
      id: 1, 
      name: 'Business Analysis Agent', 
      type: 'business-analyst', 
      status: 'active',
      joinedAt: new Date().toISOString(),
      contributionCount: 12,
    },
    { 
      id: 2, 
      name: 'Technical Architecture Agent', 
      type: 'tech-lead', 
      status: 'active',
      joinedAt: new Date().toISOString(),
      contributionCount: 8,
    },
    { 
      id: 3, 
      name: 'UX Research Agent', 
      type: 'ux-designer', 
      status: 'active',
      joinedAt: new Date().toISOString(),
      contributionCount: 15,
    },
    { 
      id: 4, 
      name: 'Product Strategy Agent', 
      type: 'product-owner', 
      status: 'processing',
      joinedAt: new Date().toISOString(),
      contributionCount: 6,
    },
  ],
  
  // Research management
  activeResearchTab: 'market',
  researchFindings: {
    market: [
      'AI development tools market expected to grow 24% annually',
      '70% of developers report spending too much time on repetitive tasks',
      'Collaborative development tools show 35% adoption increase in 2024',
      'Enterprise focus on reducing development costs by 30%',
    ],
    competitive: [
      'GitHub Copilot: Leading AI code completion, 40M+ users',
      'Replit: Collaborative IDE with AI features, growing rapidly',
      'Tabnine: AI code completion, enterprise focus',
      'CodeWhisperer: Amazon\'s AI coding assistant, AWS integration',
    ],
    technical: [
      'Large Language Models (LLMs) show 85% accuracy in code generation',
      'Real-time collaboration requires WebSocket optimization',
      'Cloud-native architecture necessary for scalability',
      'Integration APIs needed for popular IDEs and tools',
    ],
    user: [
      '85% of developers prefer integrated AI tools over standalone solutions',
      'Speed and accuracy are the top priorities for AI assistance',
      'Teams want seamless collaboration without context switching',
      'Security and code quality concerns are primary adoption barriers',
    ],
  },
  
  // Document management
  documents: {
    prd: {
      progress: 45,
      sections: [
        { name: 'Executive Summary', status: 'complete' },
        { name: 'Product Overview', status: 'complete' },
        { name: 'User Stories & Features', status: 'in-progress' },
        { name: 'Technical Requirements', status: 'pending' },
        { name: 'Success Metrics', status: 'pending' },
      ],
    },
    brd: {
      progress: 25,
      sections: [
        { name: 'Business Objectives', status: 'complete' },
        { name: 'Stakeholder Analysis', status: 'in-progress' },
        { name: 'Cost-Benefit Analysis', status: 'pending' },
        { name: 'Risk Assessment', status: 'pending' },
        { name: 'Implementation Timeline', status: 'pending' },
      ],
    },
  },
  
  // Collaboration metadata
  lastUpdated: new Date().toISOString(),
  version: 1,
};

// Reducer function
function collaborativePlanningReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_PHASE:
      return {
        ...state,
        currentPhase: action.payload.phase,
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.COMPLETE_PHASE:
      const updatedPhases = state.phases.map(phase => 
        phase.id === state.currentPhase 
          ? { ...phase, completed: true }
          : phase
      );
      
      return {
        ...state,
        phases: updatedPhases,
        currentPhase: state.currentPhase < 7 ? state.currentPhase + 1 : state.currentPhase,
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.ADD_IDEA:
      const newIdea = {
        id: Date.now(),
        ...action.payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: 0,
        tags: action.payload.tags || [],
        group: null,
      };
      
      return {
        ...state,
        ideas: [...state.ideas, newIdea],
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.UPDATE_IDEA:
      return {
        ...state,
        ideas: state.ideas.map(idea =>
          idea.id === action.payload.id
            ? { ...idea, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : idea
        ),
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.DELETE_IDEA:
      return {
        ...state,
        ideas: state.ideas.filter(idea => idea.id !== action.payload.id),
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.VOTE_IDEA:
      return {
        ...state,
        ideas: state.ideas.map(idea =>
          idea.id === action.payload.id
            ? { ...idea, votes: idea.votes + action.payload.increment }
            : idea
        ),
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.GROUP_IDEAS:
      return {
        ...state,
        ideaGroups: action.payload.groups,
        ideas: state.ideas.map(idea => {
          const group = action.payload.groups.find(g => g.ideaIds.includes(idea.id));
          return group ? { ...idea, group: group.id } : idea;
        }),
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.SET_VOTING_ENABLED:
      return {
        ...state,
        votingEnabled: action.payload.enabled,
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.UPDATE_SESSION:
      return {
        ...state,
        session: { ...state.session, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.ADD_PARTICIPANT:
      const newParticipant = {
        id: Date.now(),
        ...action.payload,
        joinedAt: new Date().toISOString(),
        contributionCount: 0,
      };
      
      return {
        ...state,
        participants: [...state.participants, newParticipant],
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.UPDATE_PARTICIPANT_STATUS:
      return {
        ...state,
        participants: state.participants.map(participant =>
          participant.id === action.payload.id
            ? { ...participant, status: action.payload.status }
            : participant
        ),
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.SET_RESEARCH_TAB:
      return {
        ...state,
        activeResearchTab: action.payload.tab,
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.ADD_RESEARCH_FINDING:
      return {
        ...state,
        researchFindings: {
          ...state.researchFindings,
          [action.payload.tab]: [
            ...state.researchFindings[action.payload.tab],
            action.payload.finding,
          ],
        },
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.UPDATE_DOCUMENT_PROGRESS:
      return {
        ...state,
        documents: {
          ...state.documents,
          [action.payload.docType]: {
            ...state.documents[action.payload.docType],
            ...action.payload.updates,
          },
        },
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.RESET_STATE:
      return {
        ...initialState,
        lastUpdated: new Date().toISOString(),
      };
      
    case ACTION_TYPES.LOAD_STATE:
      return {
        ...action.payload.state,
        lastUpdated: new Date().toISOString(),
      };
      
    default:
      return state;
  }
}

// Custom hook
export const useCollaborativePlanning = () => {
  const [state, dispatch] = useReducer(collaborativePlanningReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-save functionality
  useEffect(() => {
    const saveState = () => {
      try {
        localStorage.setItem('collaborativePlanningState', JSON.stringify(state));
      } catch (err) {
        console.warn('Failed to save state to localStorage:', err);
      }
    };

    const timeoutId = setTimeout(saveState, 1000); // Debounced save
    return () => clearTimeout(timeoutId);
  }, [state]);

  // Load state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('collaborativePlanningState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: ACTION_TYPES.LOAD_STATE, payload: { state: parsedState } });
      }
    } catch (err) {
      console.warn('Failed to load state from localStorage:', err);
    }
  }, []);

  // Action creators
  const actions = {
    setPhase: useCallback((phase) => {
      dispatch({ type: ACTION_TYPES.SET_PHASE, payload: { phase } });
    }, []),

    completePhase: useCallback(() => {
      dispatch({ type: ACTION_TYPES.COMPLETE_PHASE });
    }, []),

    addIdea: useCallback((ideaData) => {
      dispatch({ type: ACTION_TYPES.ADD_IDEA, payload: ideaData });
    }, []),

    updateIdea: useCallback((id, updates) => {
      dispatch({ type: ACTION_TYPES.UPDATE_IDEA, payload: { id, updates } });
    }, []),

    deleteIdea: useCallback((id) => {
      dispatch({ type: ACTION_TYPES.DELETE_IDEA, payload: { id } });
    }, []),

    voteIdea: useCallback((id, increment = 1) => {
      dispatch({ type: ACTION_TYPES.VOTE_IDEA, payload: { id, increment } });
    }, []),

    groupIdeas: useCallback((groups) => {
      dispatch({ type: ACTION_TYPES.GROUP_IDEAS, payload: { groups } });
    }, []),

    setVotingEnabled: useCallback((enabled) => {
      dispatch({ type: ACTION_TYPES.SET_VOTING_ENABLED, payload: { enabled } });
    }, []),

    updateSession: useCallback((sessionData) => {
      dispatch({ type: ACTION_TYPES.UPDATE_SESSION, payload: sessionData });
    }, []),

    addParticipant: useCallback((participantData) => {
      dispatch({ type: ACTION_TYPES.ADD_PARTICIPANT, payload: participantData });
    }, []),

    updateParticipantStatus: useCallback((id, status) => {
      dispatch({ type: ACTION_TYPES.UPDATE_PARTICIPANT_STATUS, payload: { id, status } });
    }, []),

    setResearchTab: useCallback((tab) => {
      dispatch({ type: ACTION_TYPES.SET_RESEARCH_TAB, payload: { tab } });
    }, []),

    addResearchFinding: useCallback((tab, finding) => {
      dispatch({ type: ACTION_TYPES.ADD_RESEARCH_FINDING, payload: { tab, finding } });
    }, []),

    updateDocumentProgress: useCallback((docType, updates) => {
      dispatch({ type: ACTION_TYPES.UPDATE_DOCUMENT_PROGRESS, payload: { docType, updates } });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: ACTION_TYPES.RESET_STATE });
    }, []),
  };

  // Computed values
  const computed = {
    currentPhaseName: state.phases.find(p => p.id === state.currentPhase)?.name || 'Unknown Phase',
    completedPhases: state.phases.filter(p => p.completed).length,
    totalIdeas: state.ideas.length,
    activeParticipants: state.participants.filter(p => p.status === 'active').length,
    topVotedIdeas: [...state.ideas].sort((a, b) => b.votes - a.votes).slice(0, 3),
    ideasByType: state.ideas.reduce((acc, idea) => {
      acc[idea.type] = (acc[idea.type] || 0) + 1;
      return acc;
    }, {}),
    sessionDuration: state.session.startTime && state.session.endTime 
      ? new Date(state.session.endTime) - new Date(state.session.startTime)
      : null,
  };

  // Utility functions
  const utils = {
    exportState: useCallback(() => {
      return JSON.stringify(state, null, 2);
    }, [state]),

    importState: useCallback((stateJson) => {
      try {
        const parsedState = JSON.parse(stateJson);
        dispatch({ type: ACTION_TYPES.LOAD_STATE, payload: { state: parsedState } });
        return true;
      } catch (err) {
        setError('Failed to import state: Invalid JSON');
        return false;
      }
    }, []),

    generateSummary: useCallback(() => {
      return {
        phase: computed.currentPhaseName,
        totalIdeas: computed.totalIdeas,
        activeParticipants: computed.activeParticipants,
        topIdeas: computed.topVotedIdeas,
        lastUpdated: state.lastUpdated,
      };
    }, [computed, state.lastUpdated]),
  };

  return {
    state,
    actions,
    computed,
    utils,
    isLoading,
    error,
    setError,
  };
};

export default useCollaborativePlanning; 