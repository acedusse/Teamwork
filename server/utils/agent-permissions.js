import crypto from 'crypto';
import logger from './logger.js';
import { loadAIAgents, saveAIAgents } from './ai-agents.js';
import { AgentSchema, UserRoleSchema, AgentPermissionSchema } from '../schemas/agent.js';

// User role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  'viewer': 1,
  'developer': 2, 
  'manager': 3,
  'admin': 4
};

// Permission level hierarchy (higher number = more access)
const PERMISSION_HIERARCHY = {
  'view': 1,
  'use': 2,
  'configure': 3,
  'full': 4
};

// Encryption key for sensitive data (in production, use proper key management)
const ENCRYPTION_KEY = process.env.AGENT_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text
 */
function encrypt(text) {
  try {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    logger.error('Error encrypting data:', error);
    return text; // Return original if encryption fails
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text to decrypt
 * @returns {string} Decrypted text
 */
function decrypt(encryptedText) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting data:', error);
    return encryptedText; // Return original if decryption fails
  }
}

/**
 * Check if user role has sufficient permissions
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required minimum role
 * @returns {boolean} True if user has sufficient role
 */
export function hasRolePermission(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if permission level is sufficient
 * @param {string} userPermission - User's permission level
 * @param {string} requiredPermission - Required minimum permission
 * @returns {boolean} True if user has sufficient permission
 */
export function hasPermissionLevel(userPermission, requiredPermission) {
  const userLevel = PERMISSION_HIERARCHY[userPermission] || 0;
  const requiredLevel = PERMISSION_HIERARCHY[requiredPermission] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Resolve user's permission for a specific agent
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {string} userRole - User's system role
 * @returns {Object} Permission details
 */
export function resolveAgentPermission(agentId, userId, userRole = 'viewer') {
  try {
    const agents = loadAIAgents();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      return {
        permission: 'view',
        canAccess: false,
        reason: 'Agent not found'
      };
    }

    // Admin has full access to everything
    if (userRole === 'admin') {
      return {
        permission: 'full',
        canAccess: true,
        reason: 'Admin override'
      };
    }

    // Check if user is the owner
    if (agent.accessControl?.ownerId === userId) {
      return {
        permission: 'full',
        canAccess: true,
        reason: 'Owner access'
      };
    }

    // Check specific ACL entry for user
    const aclEntry = agent.accessControl?.acl?.find(entry => entry.userId === userId);
    if (aclEntry) {
      // Check if permission has expired
      if (aclEntry.expiresAt && new Date(aclEntry.expiresAt) < new Date()) {
        return {
          permission: 'view',
          canAccess: false,
          reason: 'Permission expired'
        };
      }

      return {
        permission: aclEntry.permission,
        canAccess: true,
        reason: 'ACL entry',
        restrictions: aclEntry.restrictions
      };
    }

    // Check if agent is public
    if (agent.accessControl?.isPublic) {
      const defaultPermission = agent.accessControl.defaultPermission || 'view';
      return {
        permission: defaultPermission,
        canAccess: true,
        reason: 'Public agent'
      };
    }

    // Default: no access
    return {
      permission: 'view',
      canAccess: false,
      reason: 'No explicit permission granted'
    };
  } catch (error) {
    logger.error('Error resolving agent permission:', error);
    return {
      permission: 'view',
      canAccess: false,
      reason: 'Permission resolution error'
    };
  }
}

/**
 * Grant permission to a user for an agent
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID to grant permission to
 * @param {string} permission - Permission level to grant
 * @param {string} grantedBy - User ID who is granting the permission
 * @param {string} grantedByRole - Role of user granting permission
 * @param {Object} options - Additional options
 * @returns {Object} Result of the operation
 */
export function grantAgentPermission(agentId, userId, permission, grantedBy, grantedByRole, options = {}) {
  try {
    const agents = loadAIAgents();
    const agentIndex = agents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) {
      return { success: false, error: 'Agent not found' };
    }

    const agent = agents[agentIndex];

    // Check if granter has permission to grant this level
    const granterPermission = resolveAgentPermission(agentId, grantedBy, grantedByRole);
    if (!granterPermission.canAccess || !hasPermissionLevel(granterPermission.permission, 'configure')) {
      return { success: false, error: 'Insufficient permissions to grant access' };
    }

    // Initialize access control if not exists
    if (!agent.accessControl) {
      agent.accessControl = {
        isPublic: false,
        ownerId: grantedBy,
        acl: [],
        defaultPermission: 'view'
      };
    }

    // Remove existing ACL entry for this user
    agent.accessControl.acl = agent.accessControl.acl.filter(entry => entry.userId !== userId);

    // Add new ACL entry
    const newAclEntry = {
      userId,
      userRole: options.userRole || 'developer',
      permission,
      grantedBy,
      grantedAt: new Date().toISOString(),
      expiresAt: options.expiresAt || null,
      restrictions: options.restrictions || {}
    };

    agent.accessControl.acl.push(newAclEntry);
    agent.lastModifiedBy = grantedBy;
    agent.updatedAt = new Date().toISOString();

    agents[agentIndex] = agent;
    saveAIAgents(agents);

    logger.info(`Permission ${permission} granted to user ${userId} for agent ${agentId} by ${grantedBy}`);
    
    return { 
      success: true, 
      message: `Permission ${permission} granted successfully`,
      aclEntry: newAclEntry
    };
  } catch (error) {
    logger.error('Error granting agent permission:', error);
    return { success: false, error: 'Failed to grant permission' };
  }
}

/**
 * Revoke permission from a user for an agent
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID to revoke permission from
 * @param {string} revokedBy - User ID who is revoking the permission
 * @param {string} revokedByRole - Role of user revoking permission
 * @returns {Object} Result of the operation
 */
export function revokeAgentPermission(agentId, userId, revokedBy, revokedByRole) {
  try {
    const agents = loadAIAgents();
    const agentIndex = agents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) {
      return { success: false, error: 'Agent not found' };
    }

    const agent = agents[agentIndex];

    // Check if revoker has permission to revoke
    const revokerPermission = resolveAgentPermission(agentId, revokedBy, revokedByRole);
    if (!revokerPermission.canAccess || !hasPermissionLevel(revokerPermission.permission, 'configure')) {
      return { success: false, error: 'Insufficient permissions to revoke access' };
    }

    // Cannot revoke from owner unless admin
    if (agent.accessControl?.ownerId === userId && revokedByRole !== 'admin') {
      return { success: false, error: 'Cannot revoke permissions from agent owner' };
    }

    // Remove ACL entry for this user
    const originalLength = agent.accessControl?.acl?.length || 0;
    if (agent.accessControl?.acl) {
      agent.accessControl.acl = agent.accessControl.acl.filter(entry => entry.userId !== userId);
    }

    if (agent.accessControl?.acl?.length === originalLength) {
      return { success: false, error: 'User did not have explicit permissions for this agent' };
    }

    agent.lastModifiedBy = revokedBy;
    agent.updatedAt = new Date().toISOString();

    agents[agentIndex] = agent;
    saveAIAgents(agents);

    logger.info(`Permission revoked from user ${userId} for agent ${agentId} by ${revokedBy}`);
    
    return { 
      success: true, 
      message: 'Permission revoked successfully'
    };
  } catch (error) {
    logger.error('Error revoking agent permission:', error);
    return { success: false, error: 'Failed to revoke permission' };
  }
}

/**
 * Check if user can perform a specific capability on an agent
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {string} userRole - User's system role
 * @param {string} capability - Capability to check
 * @param {Object} context - Additional context (projectId, etc.)
 * @returns {Object} Permission check result
 */
export function checkAgentCapabilityPermission(agentId, userId, userRole, capability, context = {}) {
  try {
    const permission = resolveAgentPermission(agentId, userId, userRole);
    
    if (!permission.canAccess) {
      return {
        allowed: false,
        reason: permission.reason
      };
    }

    // Check if user has 'use' permission or higher
    if (!hasPermissionLevel(permission.permission, 'use')) {
      return {
        allowed: false,
        reason: 'Insufficient permission level for agent usage'
      };
    }

    // Check capability restrictions
    if (permission.restrictions?.capabilities) {
      if (!permission.restrictions.capabilities.includes(capability)) {
        return {
          allowed: false,
          reason: 'Capability not allowed by user restrictions'
        };
      }
    }

    // Check project restrictions
    if (permission.restrictions?.allowedProjects && context.projectId) {
      if (!permission.restrictions.allowedProjects.includes(context.projectId)) {
        return {
          allowed: false,
          reason: 'Project not allowed by user restrictions'
        };
      }
    }

    // Check daily usage limits
    if (permission.restrictions?.maxUsagePerDay) {
      // TODO: Implement usage tracking
      // For now, assume usage is within limits
    }

    return {
      allowed: true,
      reason: 'Permission granted'
    };
  } catch (error) {
    logger.error('Error checking agent capability permission:', error);
    return {
      allowed: false,
      reason: 'Permission check error'
    };
  }
}

/**
 * Update agent configuration (with permission checking)
 * @param {string} agentId - Agent ID
 * @param {Object} configUpdate - Configuration updates
 * @param {string} updatedBy - User ID making the update
 * @param {string} updatedByRole - Role of user making update
 * @returns {Object} Result of the operation
 */
export function updateAgentConfiguration(agentId, configUpdate, updatedBy, updatedByRole) {
  try {
    const agents = loadAIAgents();
    const agentIndex = agents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) {
      return { success: false, error: 'Agent not found' };
    }

    const agent = agents[agentIndex];

    // Check if user has permission to configure
    const userPermission = resolveAgentPermission(agentId, updatedBy, updatedByRole);
    if (!userPermission.canAccess || !hasPermissionLevel(userPermission.permission, 'configure')) {
      return { success: false, error: 'Insufficient permissions to configure agent' };
    }

    // Validate configuration update
    try {
      // Only allow certain fields to be updated based on permission level
      const allowedFields = ['configuration', 'description', 'capabilities'];
      
      // Full permission allows updating sensitive fields
      if (hasPermissionLevel(userPermission.permission, 'full')) {
        allowedFields.push('apiConfiguration', 'accessControl');
      }

      const sanitizedUpdate = {};
      for (const [key, value] of Object.entries(configUpdate)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdate[key] = value;
        }
      }

      // Encrypt sensitive API configuration if present
      if (sanitizedUpdate.apiConfiguration?.apiKey) {
        sanitizedUpdate.apiConfiguration.apiKey = encrypt(sanitizedUpdate.apiConfiguration.apiKey);
      }

      // Merge updates
      Object.assign(agent, sanitizedUpdate);
      agent.lastModifiedBy = updatedBy;
      agent.updatedAt = new Date().toISOString();

      agents[agentIndex] = agent;
      saveAIAgents(agents);

      logger.info(`Agent ${agentId} configuration updated by ${updatedBy}`);
      
      return { 
        success: true, 
        message: 'Agent configuration updated successfully',
        agent: sanitizeAgentForUser(agent, updatedBy, updatedByRole)
      };
    } catch (validationError) {
      return { success: false, error: 'Invalid configuration data' };
    }
  } catch (error) {
    logger.error('Error updating agent configuration:', error);
    return { success: false, error: 'Failed to update agent configuration' };
  }
}

/**
 * Sanitize agent data based on user permissions
 * @param {Object} agent - Agent object
 * @param {string} userId - User ID
 * @param {string} userRole - User's system role
 * @returns {Object} Sanitized agent object
 */
export function sanitizeAgentForUser(agent, userId, userRole) {
  try {
    const permission = resolveAgentPermission(agent.id, userId, userRole);
    const sanitized = { ...agent };

    // Always remove sensitive API configuration
    if (sanitized.apiConfiguration?.apiKey) {
      if (hasPermissionLevel(permission.permission, 'full')) {
        // Decrypt for users with full permission
        sanitized.apiConfiguration.apiKey = decrypt(sanitized.apiConfiguration.apiKey);
      } else {
        // Hide API key for other users
        sanitized.apiConfiguration.apiKey = '***hidden***';
      }
    }

    // Remove ACL details for non-admin users
    if (userRole !== 'admin' && !hasPermissionLevel(permission.permission, 'full')) {
      if (sanitized.accessControl?.acl) {
        sanitized.accessControl.acl = sanitized.accessControl.acl.map(entry => ({
          userId: entry.userId === userId ? entry.userId : '***hidden***',
          permission: entry.permission,
          grantedAt: entry.grantedAt
        }));
      }
    }

    // Add user's current permission info
    sanitized._userPermission = {
      permission: permission.permission,
      canAccess: permission.canAccess,
      reason: permission.reason,
      restrictions: permission.restrictions
    };

    return sanitized;
  } catch (error) {
    logger.error('Error sanitizing agent data:', error);
    return agent; // Return original if sanitization fails
  }
}

/**
 * Get all agents accessible to a user
 * @param {string} userId - User ID
 * @param {string} userRole - User's system role
 * @returns {Array} Array of accessible agents
 */
export function getAccessibleAgents(userId, userRole) {
  try {
    const agents = loadAIAgents();
    const accessibleAgents = [];

    for (const agent of agents) {
      const permission = resolveAgentPermission(agent.id, userId, userRole);
      if (permission.canAccess) {
        accessibleAgents.push(sanitizeAgentForUser(agent, userId, userRole));
      }
    }

    return accessibleAgents;
  } catch (error) {
    logger.error('Error getting accessible agents:', error);
    return [];
  }
}

/**
 * Create a new agent with proper access control
 * @param {Object} agentData - Agent data
 * @param {string} createdBy - User ID creating the agent
 * @param {string} createdByRole - Role of user creating agent
 * @returns {Object} Result of the operation
 */
export function createAgentWithPermissions(agentData, createdBy, createdByRole) {
  try {
    // Check if user has permission to create agents
    if (!hasRolePermission(createdByRole, 'developer')) {
      return { success: false, error: 'Insufficient role to create agents' };
    }

    const agents = loadAIAgents();
    
    // Generate unique ID
    const agentId = agentData.id || `agent-${Date.now()}`;
    
    // Check if agent ID already exists
    if (agents.find(a => a.id === agentId)) {
      return { success: false, error: 'Agent ID already exists' };
    }

    // Create agent with access control
    const newAgent = {
      ...agentData,
      id: agentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      lastModifiedBy: createdBy,
      accessControl: {
        isPublic: agentData.accessControl?.isPublic || false,
        ownerId: createdBy,
        acl: [],
        defaultPermission: agentData.accessControl?.defaultPermission || 'view'
      },
      usage: {
        totalSessions: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        lastUsed: null,
        averageResponseTime: null
      }
    };

    // Encrypt API key if provided
    if (newAgent.apiConfiguration?.apiKey) {
      newAgent.apiConfiguration.apiKey = encrypt(newAgent.apiConfiguration.apiKey);
    }

    agents.push(newAgent);
    saveAIAgents(agents);

    logger.info(`Agent ${agentId} created by ${createdBy}`);
    
    return { 
      success: true, 
      message: 'Agent created successfully',
      agent: sanitizeAgentForUser(newAgent, createdBy, createdByRole)
    };
  } catch (error) {
    logger.error('Error creating agent:', error);
    return { success: false, error: 'Failed to create agent' };
  }
}
