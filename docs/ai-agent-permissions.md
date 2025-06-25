# AI Agent Role & Permission Model

## Overview

This document describes the role and permission model for AI agent configuration and usage in the Scrumban AI Dashboard. It covers user roles, permission levels, access control mechanisms, enforcement points, and extension guidelines.

---

## 1. Role Hierarchy

Roles determine the overall authority a user has in the system. Higher roles inherit all permissions of lower roles.

| Role      | Level | Description                                 |
|-----------|-------|---------------------------------------------|
| viewer    | 1     | Read-only access to agents and insights      |
| developer | 2     | Can use agents, but not configure or manage  |
| manager   | 3     | Can configure agents, manage permissions     |
| admin     | 4     | Full system control, can do everything       |

---

## 2. Permission Levels

Permissions are granted per agent (via ACL, ownership, or public access):

| Permission | Level | Description                                 |
|------------|-------|---------------------------------------------|
| view       | 1     | Can view agent details and outputs           |
| use        | 2     | Can use the agent for tasks                  |
| configure  | 3     | Can update agent configuration, grant/revoke |
| full       | 4     | Full control (including sensitive fields)    |

---

## 3. Access Control

### 3.1. Ownership
- The creator of an agent is its owner and has `full` permission.
- Owners can transfer ownership or delegate permissions.

### 3.2. ACL (Access Control List)
- Each agent has an `acl` array specifying user-specific permissions, optional restrictions, and expiration.
- Only users with `configure` or `full` permission can modify the ACL.

### 3.3. Public Agents
- Agents can be marked as public (`isPublic: true`).
- Public agents grant the `defaultPermission` to all users not explicitly listed in the ACL.

---

## 4. Enforcement Points

### 4.1. Backend
- All API endpoints for agent configuration, permission changes, and sensitive actions check the current user's role and permission level.
- Only users with sufficient permission can update configuration, grant/revoke permissions, or access sensitive data.
- Sensitive fields (e.g., API keys, ACL) are hidden from users without `full` permission.

### 4.2. Frontend
- The UI uses the `useAgentPermissions` hook to determine the current user's permissions for each agent.
- UI elements for restricted actions are hidden or disabled if the user lacks permission.
- Permission errors from the backend are surfaced to the user.

---

## 5. Extending the System

- **Adding Roles:** Update the `ROLE_HIERARCHY` in `server/utils/agent-permissions.js` and `USER_ROLES` in the frontend.
- **Adding Permissions:** Update the `PERMISSION_HIERARCHY` and ensure all checks are updated accordingly.
- **Custom Restrictions:** ACL entries can include custom restrictions (e.g., time limits, capability restrictions).
- **Auditing:** All permission changes and configuration updates are logged for audit purposes.

---

## 6. Example Workflows

### 6.1. Granting Permission
- A manager opens the Agent Configuration Modal, adds a user to the ACL, and selects a permission level.
- The backend checks that the manager has `configure` or `full` permission before granting.

### 6.2. Revoking Permission
- An admin removes a user from the ACL in the modal.
- The backend checks that the admin has `configure` or `full` permission before revoking.

### 6.3. Public Agent Access
- A developer accesses a public agent. If not in the ACL, they receive the agent's `defaultPermission`.

### 6.4. Ownership Transfer
- The owner can transfer ownership by updating the `ownerId` in the agent's access control (requires `full` permission).

---

## 7. References
- Backend: `server/utils/agent-permissions.js`, `server/routes/agent-permissions.js`
- Frontend: `ui/src/hooks/useAgentPermissions.js`, `ui/src/components/modals/AgentConfigurationModal.jsx`

---

*For questions or to extend the permission model, see the code comments in the referenced files or contact the maintainers.* 