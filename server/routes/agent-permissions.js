import express from 'express';
import authenticate from '../middleware/auth.js';
import {
  resolveAgentPermission,
  grantAgentPermission,
  revokeAgentPermission,
  updateAgentConfiguration,
  getAccessibleAgents,
  createAgentWithPermissions,
  sanitizeAgentForUser,
  checkAgentCapabilityPermission
} from '../utils/agent-permissions.js';
import { loadAIAgents } from '../utils/ai-agents.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to extract user info from request
// In a real application, this would come from JWT tokens or session
function extractUserInfo(req, res, next) {
  // For now, use headers or query params for user identification
  req.user = {
    id: req.headers['x-user-id'] || req.query.userId || 'default-user',
    role: req.headers['x-user-role'] || req.query.userRole || 'developer',
    name: req.headers['x-user-name'] || req.query.userName || 'Default User'
  };
  next();
}

// Apply authentication and user extraction to all routes
router.use(authenticate);
router.use(extractUserInfo);

/**
 * GET /api/agent-permissions/agents
 * Get all agents accessible to the current user
 */
router.get('/agents', async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const accessibleAgents = getAccessibleAgents(userId, userRole);
    
    res.json({
      success: true,
      agents: accessibleAgents,
      count: accessibleAgents.length
    });
  } catch (error) {
    logger.error('Error getting accessible agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve accessible agents'
    });
  }
});

/**
 * GET /api/agent-permissions/agents/:agentId
 * Get specific agent with user's permission details
 */
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    const agents = loadAIAgents();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const permission = resolveAgentPermission(agentId, userId, userRole);
    
    if (!permission.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this agent',
        reason: permission.reason
      });
    }
    
    const sanitizedAgent = sanitizeAgentForUser(agent, userId, userRole);
    
    res.json({
      success: true,
      agent: sanitizedAgent,
      permission: permission
    });
  } catch (error) {
    logger.error('Error getting agent details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent details'
    });
  }
});

/**
 * POST /api/agent-permissions/agents
 * Create a new agent with proper access control
 */
router.post('/agents', async (req, res) => {
  try {
    const agentData = req.body;
    const { id: userId, role: userRole } = req.user;
    
    const result = createAgentWithPermissions(agentData, userId, userRole);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent'
    });
  }
});

/**
 * PUT /api/agent-permissions/agents/:agentId/configuration
 * Update agent configuration with permission checking
 */
router.put('/agents/:agentId/configuration', async (req, res) => {
  try {
    const { agentId } = req.params;
    const configUpdate = req.body;
    const { id: userId, role: userRole } = req.user;
    
    const result = updateAgentConfiguration(agentId, configUpdate, userId, userRole);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error updating agent configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent configuration'
    });
  }
});

/**
 * POST /api/agent-permissions/agents/:agentId/permissions/grant
 * Grant permission to a user for an agent
 */
router.post('/agents/:agentId/permissions/grant', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { userId: targetUserId, permission, userRole: targetUserRole, restrictions, expiresAt } = req.body;
    const { id: grantedBy, role: grantedByRole } = req.user;
    
    if (!targetUserId || !permission) {
      return res.status(400).json({
        success: false,
        error: 'userId and permission are required'
      });
    }
    
    const options = {
      userRole: targetUserRole,
      restrictions,
      expiresAt
    };
    
    const result = grantAgentPermission(agentId, targetUserId, permission, grantedBy, grantedByRole, options);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error granting agent permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant agent permission'
    });
  }
});

/**
 * POST /api/agent-permissions/agents/:agentId/permissions/revoke
 * Revoke permission from a user for an agent
 */
router.post('/agents/:agentId/permissions/revoke', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { userId: targetUserId } = req.body;
    const { id: revokedBy, role: revokedByRole } = req.user;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    const result = revokeAgentPermission(agentId, targetUserId, revokedBy, revokedByRole);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error revoking agent permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke agent permission'
    });
  }
});

/**
 * GET /api/agent-permissions/agents/:agentId/permissions
 * Get permission details for an agent
 */
router.get('/agents/:agentId/permissions', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    const permission = resolveAgentPermission(agentId, userId, userRole);
    
    res.json({
      success: true,
      permission,
      agentId
    });
  } catch (error) {
    logger.error('Error getting agent permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent permissions'
    });
  }
});

/**
 * POST /api/agent-permissions/agents/:agentId/capabilities/:capability/check
 * Check if user can perform a specific capability on an agent
 */
router.post('/agents/:agentId/capabilities/:capability/check', async (req, res) => {
  try {
    const { agentId, capability } = req.params;
    const { projectId } = req.body;
    const { id: userId, role: userRole } = req.user;
    
    const context = { projectId };
    const result = checkAgentCapabilityPermission(agentId, userId, userRole, capability, context);
    
    res.json({
      success: true,
      allowed: result.allowed,
      reason: result.reason,
      agentId,
      capability,
      context
    });
  } catch (error) {
    logger.error('Error checking agent capability permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check agent capability permission'
    });
  }
});

/**
 * GET /api/agent-permissions/agents/:agentId/acl
 * Get access control list for an agent (admin/owner only)
 */
router.get('/agents/:agentId/acl', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    const agents = loadAIAgents();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const permission = resolveAgentPermission(agentId, userId, userRole);
    
    // Only admin or owner can view full ACL
    if (userRole !== 'admin' && agent.accessControl?.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view ACL'
      });
    }
    
    res.json({
      success: true,
      acl: agent.accessControl?.acl || [],
      ownerId: agent.accessControl?.ownerId,
      isPublic: agent.accessControl?.isPublic,
      defaultPermission: agent.accessControl?.defaultPermission
    });
  } catch (error) {
    logger.error('Error getting agent ACL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent ACL'
    });
  }
});

/**
 * GET /api/agent-permissions/roles
 * Get available user roles and permission levels
 */
router.get('/roles', async (req, res) => {
  try {
    res.json({
      success: true,
      userRoles: [
        { value: 'viewer', name: 'Viewer', description: 'Read-only access' },
        { value: 'developer', name: 'Developer', description: 'Agent usage and configuration' },
        { value: 'manager', name: 'Manager', description: 'Team and agent management' },
        { value: 'admin', name: 'Admin', description: 'Full system access' }
      ],
      permissionLevels: [
        { value: 'view', name: 'View', description: 'View-only access' },
        { value: 'use', name: 'Use', description: 'Can use agent but not configure' },
        { value: 'configure', name: 'Configure', description: 'Can configure agent settings' },
        { value: 'full', name: 'Full', description: 'Complete agent control' }
      ]
    });
  } catch (error) {
    logger.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve roles'
    });
  }
});

/**
 * GET /api/agent-permissions/user/profile
 * Get current user's profile and permissions summary
 */
router.get('/user/profile', async (req, res) => {
  try {
    const { id: userId, role: userRole, name: userName } = req.user;
    
    const agents = loadAIAgents();
    const accessibleAgents = getAccessibleAgents(userId, userRole);
    
    const permissionSummary = {
      totalAgents: agents.length,
      accessibleAgents: accessibleAgents.length,
      ownedAgents: agents.filter(a => a.accessControl?.ownerId === userId).length,
      permissions: {
        canCreateAgents: userRole !== 'viewer',
        canManageUsers: userRole === 'admin' || userRole === 'manager',
        isAdmin: userRole === 'admin'
      }
    };
    
    res.json({
      success: true,
      user: {
        id: userId,
        name: userName,
        role: userRole
      },
      permissionSummary
    });
  } catch (error) {
    logger.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile'
    });
  }
});

export default router;
