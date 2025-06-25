import { z } from 'zod';

// User roles with hierarchical permissions
export const UserRoleSchema = z.enum([
  'admin',      // Full system access
  'manager',    // Team and agent management
  'developer',  // Agent usage and configuration
  'viewer'      // Read-only access
]);

// Agent permission levels
export const AgentPermissionSchema = z.enum([
  'full',       // Complete agent control
  'configure',  // Can configure agent settings
  'use',        // Can use agent but not configure
  'view'        // View-only access
]);

// Agent configuration settings
export const AgentConfigurationSchema = z.object({
  maxConcurrentTasks: z.number().min(1).max(10).default(3),
  autoAcceptTasks: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  allowedCapabilities: z.array(z.string()).optional(),
  restrictedCapabilities: z.array(z.string()).optional(),
  workingHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().optional(), // HH:MM format
    end: z.string().optional(),   // HH:MM format
    timezone: z.string().optional()
  }).optional(),
  costLimits: z.object({
    enabled: z.boolean().default(false),
    dailyLimit: z.number().positive().optional(),
    monthlyLimit: z.number().positive().optional()
  }).optional()
});

// Agent access control list
export const AgentACLSchema = z.object({
  userId: z.string(),
  userRole: UserRoleSchema,
  permission: AgentPermissionSchema,
  grantedBy: z.string(), // User ID who granted permission
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  restrictions: z.object({
    capabilities: z.array(z.string()).optional(),
    maxUsagePerDay: z.number().optional(),
    allowedProjects: z.array(z.string()).optional()
  }).optional()
});

// Extended agent schema with permissions and configuration
export const AgentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  type: z.string(),
  description: z.string().max(500).optional(),
  status: z.enum(['idle', 'active', 'thinking', 'working', 'disabled']).default('idle'),
  capabilities: z.array(z.string()).optional(),
  avatar: z.string().optional(),
  color: z.string().optional(),
  
  // Configuration settings
  configuration: AgentConfigurationSchema.optional(),
  
  // Access control
  accessControl: z.object({
    isPublic: z.boolean().default(false), // If true, all users can view/use
    ownerId: z.string(), // User who created the agent
    acl: z.array(AgentACLSchema).default([]), // Access control list
    defaultPermission: AgentPermissionSchema.default('view') // Default permission for new users
  }),
  
  // API configuration (sensitive)
  apiConfiguration: z.object({
    provider: z.string(),
    modelId: z.string(),
    apiKey: z.string().optional(), // Encrypted in storage
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    customEndpoint: z.string().url().optional()
  }).optional(),
  
  // Audit trail
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Runtime data
  lastActivity: z.string().datetime().optional(),
  currentTask: z.any().optional(),
  recommendations: z.array(z.any()).default([]),
  
  // Usage statistics
  usage: z.object({
    totalSessions: z.number().default(0),
    totalTokensUsed: z.number().default(0),
    totalCost: z.number().default(0),
    lastUsed: z.string().datetime().optional(),
    averageResponseTime: z.number().optional()
  }).optional()
});

// Schema for updating agent configuration
export const AgentUpdateSchema = AgentSchema.partial();

// Schema for granting/revoking agent permissions
export const AgentPermissionUpdateSchema = z.object({
  agentId: z.string(),
  userId: z.string(),
  permission: AgentPermissionSchema,
  restrictions: z.object({
    capabilities: z.array(z.string()).optional(),
    maxUsagePerDay: z.number().optional(),
    allowedProjects: z.array(z.string()).optional()
  }).optional(),
  expiresAt: z.string().datetime().optional()
});

// Schema for agent usage request (permission checking)
export const AgentUsageRequestSchema = z.object({
  agentId: z.string(),
  userId: z.string(),
  requestedCapability: z.string().optional(),
  projectId: z.string().optional(),
  estimatedTokens: z.number().optional()
});
