/**
 * AIAgentPanel.jsx
 * Panel component for managing AI agent participation in brainstorming sessions
 */

import React, { useState } from 'react';
import { 
  Users, 
  Bot, 
  Brain, 
  Settings, 
  Play, 
  Square, 
  Lightbulb,
  BarChart3,
  Vote,
  Layers,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

const AIAgentPanel = ({
  agentParticipants = [],
  sessionActive = false,
  isGeneratingIdeas = false,
  isEvaluatingIdeas = false,
  isClusteringIdeas = false,
  isVoting = false,
  error = null,
  config = {},
  onStartSession,
  onEndSession,
  onGenerateIdeas,
  onEvaluateIdeas,
  onClusterIdeas,
  onGetVotes,
  onUpdateConfig,
  onClearError
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleConfigSave = () => {
    onUpdateConfig(localConfig);
    setShowConfig(false);
  };

  const getAgentStatusIcon = (agent) => {
    if (isGeneratingIdeas || isEvaluatingIdeas || isClusteringIdeas || isVoting) {
      return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
    
    switch (agent.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'thinking':
        return <Brain className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAgentTypeColor = (type) => {
    const colors = {
      optimization: 'bg-blue-100 text-blue-800',
      estimation: 'bg-green-100 text-green-800',
      planning: 'bg-purple-100 text-purple-800',
      quality: 'bg-orange-100 text-orange-800',
      dependencies: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Agents</h3>
            {sessionActive && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Active Session
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Configure AI Agents"
            >
              <Settings className="w-4 h-4" />
            </button>
            {sessionActive ? (
              <button
                onClick={onEndSession}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <Square className="w-3 h-3" />
                <span>End Session</span>
              </button>
            ) : (
              <button
                onClick={onStartSession}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Play className="w-3 h-3" />
                <span>Start Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={onClearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Session Configuration</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Focus Area
              </label>
              <input
                type="text"
                value={localConfig.focusArea || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, focusArea: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., Core Features, User Experience"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Session Duration (minutes)
              </label>
              <input
                type="number"
                value={localConfig.duration || 90}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="15"
                max="180"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Agent Types
              </label>
              <div className="flex flex-wrap gap-2">
                {['optimization', 'estimation', 'planning', 'quality', 'dependencies'].map(type => (
                  <label key={type} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={localConfig.participantTypes?.includes(type) || false}
                      onChange={(e) => {
                        const types = localConfig.participantTypes || [];
                        if (e.target.checked) {
                          setLocalConfig(prev => ({ 
                            ...prev, 
                            participantTypes: [...types, type] 
                          }));
                        } else {
                          setLocalConfig(prev => ({ 
                            ...prev, 
                            participantTypes: types.filter(t => t !== type) 
                          }));
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-xs text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleConfigSave}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setLocalConfig(config);
                  setShowConfig(false);
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="p-4">
        {agentParticipants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No AI agents active</p>
            <p className="text-xs text-gray-400 mt-1">Start a session to activate AI agents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agentParticipants.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {getAgentStatusIcon(agent)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAgentTypeColor(agent.type)}`}>
                        {agent.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {sessionActive && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onGenerateIdeas('feature')}
              disabled={isGeneratingIdeas}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{isGeneratingIdeas ? 'Generating...' : 'Generate Ideas'}</span>
            </button>
            
            <button
              onClick={() => onEvaluateIdeas([])}
              disabled={isEvaluatingIdeas}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isEvaluatingIdeas ? 'Evaluating...' : 'Evaluate Ideas'}</span>
            </button>
            
            <button
              onClick={() => onClusterIdeas([])}
              disabled={isClusteringIdeas}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Layers className="w-4 h-4" />
              <span>{isClusteringIdeas ? 'Clustering...' : 'Cluster Ideas'}</span>
            </button>
            
            <button
              onClick={() => onGetVotes([])}
              disabled={isVoting}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Vote className="w-4 h-4" />
              <span>{isVoting ? 'Voting...' : 'Get Votes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentPanel; 