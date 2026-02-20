import { updateSyncState } from '../scripts/SyncBadge.js';
import { initAgentsTab } from '../scripts/supervisor/AgentsTab.js';
import { loadPendingTickets, loadApprovalData } from '../scripts/supervisor/TicketsTab.js';
import { initAnalyticsTab } from '../scripts/supervisor/AnalyticsTab.js';
import { loadStatusUpdates, renderTicketTabNotifications } from '../renderer/Supervisor/SupervisorNotifications.js';
import { updateActiveCache } from '../state/agentState.js';
import { startWsHealthPolling, stopWsHealthPolling } from './wsHealthPoll.js';
import { updateConnectionStatus } from '../scripts/lights/ConnectionLights.js';

let socket;

let shouldReconnect = true;

export function initSupervisorSocket() {
    connect();
}

export function isSocketConnected() {
    return socket && socket.readyState === WebSocket.OPEN;
}

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    console.log(`[SupervisorSocket] Connecting to ${wsUrl}...`);
    socket = new WebSocket(wsUrl);

    socket.onopen = async () => {
        console.log('[SupervisorSocket] Connected');
        updateConnectionStatus('ws', 'active');
        stopWsHealthPolling();

        // Register as supervisor
        send({
            type: 'register',
            role: 'supervisor'
        });

        updateSyncState(document, 'syncing');

        const { processOfflineQueue } = await import('../queue/ProcessEvents.js');
        const { openDB } = await import('../INDEXDB/IndexDB.js');
        const db = await openDB();

        await processOfflineQueue(db);
        updateSyncState(document, 'synced');
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('[SupervisorSocket] Received:', message);
            handleMessage(message);
        } catch (err) {
            console.error('[SupervisorSocket] Error parsing message:', err);
        }
    };

    socket.onclose = () => {
        console.log('[SupervisorSocket] Disconnected');
        updateSyncState(document, 'offline');
        updateConnectionStatus('ws', 'inactive');

        if (!shouldReconnect) return;

        startWsHealthPolling({
            document,
            onHealthy: () => {
                console.log('[SupervisorSocket] Server healthy again, reconnecting...');
                stopWsHealthPolling();
                connect();
            }
        });
    };

    socket.onerror = (err) => {
        console.error('[SupervisorSocket] Error:', err);
        socket.close();
    };
}

function send(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('[SupervisorSocket] Sending:', payload);
        socket.send(JSON.stringify(payload));
    } else {
        console.warn('[SupervisorSocket] Cannot send, socket not open:', payload);
    }
}

function handleMessage(message) {
    switch (message.type) {
        case 'agent:status_updated':
            console.log('[SupervisorSocket] Agent status updated, reloading agents...');
            initAgentsTab();
            loadStatusUpdates(message);
            updateActiveCache(message.agentId, message.agentobj, message.status);
            break;

        case 'issue:approval':
            console.log('[SupervisorSocket] New approval request');
            loadApprovalData();
            initAnalyticsTab();
            renderTicketTabNotifications(message);
            break;

        case 'issue:created':
            console.log('[SupervisorSocket] New issue created');
            loadPendingTickets();
            initAnalyticsTab();
            renderTicketTabNotifications(message);
            break;

        case 'issue:resolved':
            console.log('[SupervisorSocket] Issue resolved');
            loadPendingTickets();
            initAgentsTab();
            initAnalyticsTab();
            renderTicketTabNotifications(message);
            break;

        case 'issue:rejected':
            console.log('[SupervisorSocket] Issue rejected');
            loadApprovalData();
            renderTicketTabNotifications(message);
            break;

        case 'poll:started':
            console.log('[SupervisorSocket] Poll started');
            updateConnectionStatus('lp', 'active');
            break;

        case 'poll:stopped':
            console.log('[SupervisorSocket] Poll stopped');
            updateConnectionStatus('lp', 'inactive');
            break;

        default:
            console.log('[SupervisorSocket] Unhandled message type:', message.type);
    }
}

//Emit socket events
export function emitCreated(ticket) {
    send({
        type: 'issue:created',
        issueId: ticket.issueId,
        agentId: ticket.agentId,
        ticket: ticket,
        timestamp: Date.now()
    });
}

export function emitStatusUpdate(agentId, status, agentobj) {
    send({
        type: 'agent:status_updated',
        agentId,
        status,
        timestamp: Date.now(),
        agentobj
    });
}

export function emitResolved(issueId, agentId) {
    send({
        type: 'issue:resolved',
        issueId,
        agentId,
        timestamp: Date.now()
    });
}

export function emitRejected(issueId, agentId) {
    send({
        type: 'issue:rejected',
        issueId,
        agentId,
        status: 'rejected',
        timestamp: Date.now()
    });
}

