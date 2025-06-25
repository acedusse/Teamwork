import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client.js';

const API_BASE = '/api/agent-permissions';

// Permission levels and user roles
export const PERMISSION_LEVELS = {
  VIEW: 'view',
  USE: 'use', 
  CONFIGURE: 'configure',
  FULL: 'full'
};

export const USER_ROLES = {
  VIEWER: 'viewer',
  DEVELOPER: 'developer',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

/**
 * Hook for managing agent permissions and configuration
 */
export const useAgentPermissions = (currentUser = null) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState(new Map());

  // Load accessible agents for current user
  const loadAccessibleAgents = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`${API_BASE}/agents`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        setAgents(response.data.agents);
        
        // Build permission map for quick access
        const permissionMap = new Map();
        response.data.agents.forEach(agent => {
          if (agent._userPermission) {
            permissionMap.set(agent.id, agent._userPermission);
          }
        });
        setUserPermissions(permissionMap);
      } else {
        throw new Error(response.data.error || 'Failed to load agents');
      }
    } catch (err) {
      console.error('Error loading accessible agents:', err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Get specific agent with permission details
  const getAgent = useCallback(async (agentId) => {
    if (!currentUser || !agentId) return null;
    
    try {
      const response = await apiClient.get(`${API_BASE}/agents/${agentId}`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        return response.data.agent;
      } else {
        throw new Error(response.data.error || 'Failed to get agent');
      }
    } catch (err) {
      console.error('Error getting agent:', err);
      throw err;
    }
  }, [currentUser]);

  // Create new agent with permissions
  const createAgent = useCallback(async (agentData) => {
    if (!currentUser) throw new Error('User authentication required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`${API_BASE}/agents`, agentData, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        await loadAccessibleAgents(); // Refresh the list
        return response.data.agent;
      } else {
        throw new Error(response.data.error || 'Failed to create agent');
      }
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err.message || 'Failed to create agent');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadAccessibleAgents]);

  // Update agent configuration
  const updateAgentConfiguration = useCallback(async (agentId, configUpdate) => {
    if (!currentUser || !agentId) throw new Error('Invalid parameters');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put(`${API_BASE}/agents/${agentId}/configuration`, configUpdate, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        await loadAccessibleAgents(); // Refresh the list
        return response.data.agent;
      } else {
        throw new Error(response.data.error || 'Failed to update configuration');
      }
    } catch (err) {
      console.error('Error updating agent configuration:', err);
      setError(err.message || 'Failed to update configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadAccessibleAgents]);

  // Grant permission to a user for an agent
  const grantPermission = useCallback(async (agentId, targetUserId, permission, options = {}) => {
    if (!currentUser || !agentId || !targetUserId || !permission) {
      throw new Error('Missing required parameters');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const requestData = {
        userId: targetUserId,
        permission,
        userRole: options.userRole || 'developer',
        restrictions: options.restrictions,
        expiresAt: options.expiresAt
      };
      
      const response = await apiClient.post(`${API_BASE}/agents/${agentId}/permissions/grant`, requestData, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        await loadAccessibleAgents(); // Refresh the list
        return response.data.aclEntry;
      } else {
        throw new Error(response.data.error || 'Failed to grant permission');
      }
    } catch (err) {
      console.error('Error granting permission:', err);
      setError(err.message || 'Failed to grant permission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadAccessibleAgents]);

  // Revoke permission from a user for an agent
  const revokePermission = useCallback(async (agentId, targetUserId) => {
    if (!currentUser || !agentId || !targetUserId) {
      throw new Error('Missing required parameters');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`${API_BASE}/agents/${agentId}/permissions/revoke`, {
        userId: targetUserId
      }, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        await loadAccessibleAgents(); // Refresh the list
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to revoke permission');
      }
    } catch (err) {
      console.error('Error revoking permission:', err);
      setError(err.message || 'Failed to revoke permission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadAccessibleAgents]);

  // Check if user can perform a specific capability on an agent
  const checkCapabilityPermission = useCallback(async (agentId, capability, context = {}) => {
    if (!currentUser || !agentId || !capability) {
      return { allowed: false, reason: 'Missing parameters' };
    }
    
    try {
      const response = await apiClient.post(`${API_BASE}/agents/${agentId}/permissions/check-capability`, {
        capability,
        context
      }, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role || 'developer',
          'x-user-name': currentUser.name || 'User'
        }
      });
      
      if (response.data.success) {
        return response.data.result;
      } else {
        return { allowed: false, reason: response.data.error || 'Permission check failed' };
      }
    } catch (err) {
      console.error('Error checking capability permission:', err);
      return { allowed: false, reason: err.message || 'Permission check error' };
    }
  }, [currentUser]);

  // Helper functions
  const hasPermission = useCallback((agentId, requiredPermission) => {
    const permission = userPermissions.get(agentId);
    if (!permission || !permission.canAccess) return false;
    
    const levels = ['view', 'use', 'configure', 'full'];
    const userLevel = levels.indexOf(permission.permission);
    const requiredLevel = levels.indexOf(requiredPermission);
    
    return userLevel >= requiredLevel;
  }, [userPermissions]);

  const canConfigureAgent = useCallback((agentId) => {
    return hasPermission(agentId, PERMISSION_LEVELS.CONFIGURE);
  }, [hasPermission]);

  const canUseAgent = useCallback((agentId) => {
    return hasPermission(agentId, PERMISSION_LEVELS.USE);
  }, [hasPermission]);

  const canViewAgent = useCallback((agentId) => {
    return hasPermission(agentId, PERMISSION_LEVELS.VIEW);
  }, [hasPermission]);

  const isAgentOwner = useCallback((agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.accessControl?.ownerId === currentUser?.id;
  }, [agents, currentUser]);

  const isAdmin = useCallback(() => {
    return currentUser?.role === USER_ROLES.ADMIN;
  }, [currentUser]);

  // Load agents on mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadAccessibleAgents();
    }
  }, [currentUser, loadAccessibleAgents]);

  return {
    // Data
    agents,
    userPermissions,
    loading,
    error,
    
    // Actions
    loadAccessibleAgents,
    getAgent,
    createAgent,
    updateAgentConfiguration,
    grantPermission,
    revokePermission,
    checkCapabilityPermission,
    
    // Helpers
    hasPermission,
    canConfigureAgent,
    canUseAgent,
    canViewAgent,
    isAgentOwner,
    isAdmin,
    
    // Clear error
    clearError: () => setError(null)
  };
};

export default useAgentPermissions;
