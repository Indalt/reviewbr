
/**
 * Agent Roles and Capabilities Registry
 */

export enum AgentRole {
    COORDINATOR = 'COORDINATOR',
    LIBRARIAN = 'LIBRARIAN',   // F2: Search/Download
    SCREENER = 'SCREENER',     // F4: Screening
    EXTRACTOR = 'EXTRACTOR',   // F5: Data Extraction
    ANALYST = 'ANALYST'        // F6-F7: Synthesis/Stats
}

export interface AgentCapability {
    canWriteProtocol: boolean;
    canDownload: boolean;
    canAccessLLM: boolean;
    canDeleteFiles: boolean;
}

/**
 * AgentOrchestrator
 * Logic for isolation of research tasks by role.
 */
export class AgentOrchestrator {
    private static REGISTRY: Record<AgentRole, AgentCapability> = {
        [AgentRole.COORDINATOR]: {
            canWriteProtocol: true,
            canDownload: true,
            canAccessLLM: true,
            canDeleteFiles: true
        },
        [AgentRole.LIBRARIAN]: {
            canWriteProtocol: false,
            canDownload: true,
            canAccessLLM: false,
            canDeleteFiles: false
        },
        [AgentRole.SCREENER]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false
        },
        [AgentRole.EXTRACTOR]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false
        },
        [AgentRole.ANALYST]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false
        }
    };

    /**
     * Enforces role-based access control for a given task.
     */
    static validateAction(role: AgentRole, action: keyof AgentCapability): void {
        const capability = this.REGISTRY[role];
        if (!capability[action]) {
            throw new Error(`ACCESS DENIED: Role ${role} is not authorized for action ${action}.`);
        }
    }
}
