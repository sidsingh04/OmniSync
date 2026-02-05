//Process events from offline queue when online
import { getOfflineQueue, removeFromOfflineQueue } from "./OfflineQueue.js";
import { isLongPollHealthy, triggerLongPollEvent } from "../LONGPOLL/PollService.js";
import { isSocketConnected as isAgentConnected, emitIssueCreated, emitIssueResolved, emitIssueRejected, emitApproval, emitStatusUpdate as emitAgentStatusUpdate, emitPollStarted, emitPollStopped } from "../WS/agentsocket.js";
import { isSocketConnected as isSupervisorConnected, emitCreated as emitSupervisorCreated, emitResolved as emitSupervisorResolved, emitRejected as emitSupervisorRejected, emitStatusUpdate as emitSupervisorStatusUpdate } from "../WS/supervisorsocket.js";

//Still want to handle force logout via long poll
//Only do it when the server is online
//Currently not implementing retry logic for failed events
export async function processOfflineQueue(db) {
    const agentConnected = isAgentConnected();
    const supervisorConnected = isSupervisorConnected();

    if (!agentConnected && !supervisorConnected) {
        console.warn("No socket connected, skipping offline queue processing.");
        return;
    }

    const queue = await getOfflineQueue(db);
    for (const event of queue) {
        //pass-event here to appropriate handler
        switch (event.type) {
            case 'issue:created':
                console.log(`[OfflineQueue]:Processing issue:created`);
                if (agentConnected) emitIssueCreated(event.payload);
                if (supervisorConnected) emitSupervisorCreated(event.payload);
                break;
            case 'issue:resolved':
                console.log(`[OfflineQueue]:Processing issue:resolved`);
                if (agentConnected) emitIssueResolved(event.issueId, event.agentId);
                if (supervisorConnected) emitSupervisorResolved(event.issueId, event.agentId);
                break;
            case 'issue:rejected':
                console.log(`[OfflineQueue]:Processing issue:rejected`);
                if (agentConnected) emitIssueRejected(event.issueId, event.agentId);
                if (supervisorConnected) emitSupervisorRejected(event.issueId, event.agentId);
                break;
            case 'issue:approval':
                console.log(`[OfflineQueue]:Processing issue:approval`);
                if (agentConnected) emitApproval(event.issueId, event.agentId);
                break;
            case 'agent:status_updated':
                console.log(`[OfflineQueue]:Processing agent:status_updated`);
                if (agentConnected) emitAgentStatusUpdate(event.agentId, event.status, event.agentobj);
                if (supervisorConnected) emitSupervisorStatusUpdate(event.agentId, event.status, event.agentobj);
                break;
            case 'agent:force_logout':
                console.log(`[OfflineQueue]:Processing force-logout`);
                await triggerLongPollEvent(event.agentId, 'FORCE_LOGOUT', 'Force logout triggered via offline queue');
                break;
            case 'poll:started':
                console.log(`[OfflineQueue]:Processing poll:started`);
                if (agentConnected) emitPollStarted();
                break;
            case 'poll:stopped':
                console.log(`[OfflineQueue]:Processing poll:stopped`);
                if (agentConnected) emitPollStopped();
                break;

            default:
                console.log('[OfflineQueue]: Unhandled message type:', event.type);
        }

        await removeFromOfflineQueue(db, event.id);
    }
}
