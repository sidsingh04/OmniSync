import { AgentUI } from '../SCRIPTS/AGENT/AgentUI.js';
import { updateSyncState } from '../SCRIPTS/SyncBadge.js';
import { renderNotifications } from '../RENDERER/Agent/AgentRenderer.js';
import { startWsHealthPolling, stopWsHealthPolling } from './wsHealthPoll.js';
import { openDB } from '../INDEXDB/IndexDB.js';
import { addIssues } from '../INDEXDB/issueService.js';

let socket;

let shouldReconnect = true;

export function initAgentSocket() {
    connect();
}

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    console.log(`[AgentSocket] Connecting to ${wsUrl}...`);
    socket = new WebSocket(wsUrl);

    socket.onopen = async () => {
        console.log('[AgentSocket] Connected');
        stopWsHealthPolling();

        send({
            type: 'register',
            role: 'agent'
        });

        updateSyncState(document, 'syncing');

        const { processOfflineQueue } = await import('../QUEUE/ProcessEvents.js');
        const { openDB } = await import('../INDEXDB/IndexDB.js');
        const db = await openDB();

        await processOfflineQueue(db);

        updateSyncState(document, 'synced');
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('[AgentSocket] Received:', message);
            handleMessage(message);
        } catch (err) {
            console.error('[AgentSocket] Error parsing message:', err);
        }
    };

    socket.onclose = () => {
        console.log('[AgentSocket] Disconnected');
        updateSyncState(document, 'offline');

        if (!shouldReconnect) return;

        startWsHealthPolling({
            document,
            onHealthy: () => {
                console.log('[AgentSocket] Server healthy again, reconnecting...');
                stopWsHealthPolling();
                connect();
            }
        });

    };

    socket.onerror = (err) => {
        console.error('[AgentSocket] Error:', err);
        socket.close();
    };
}

function send(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('[AgentSocket] Sending:', payload);
        socket.send(JSON.stringify(payload));
    } else {
        console.warn('[AgentSocket] Cannot send, socket not open:', payload);
    }
}

async function handleMessage(message) {
    // if (message.agentId !== sessionStorage.getItem('userId')) return;

    switch (message.type) {
        case 'issue:created':
            console.log(`[AgentSocket] Issue created: ${message.issueId}`);
            if (message.ticket) {
                const db = await openDB();
                await addIssues(db, message.ticket);
            }
            AgentUI.loadDashboardData();
            renderNotifications(message);
            break;
        case 'issue:resolved':
            console.log(`[AgentSocket] Issue resolved: ${message.issueId}`);
            AgentUI.loadDashboardData();
            renderNotifications(message);
            break;
        case 'issue:rejected':
            console.log(`[AgentSocket] Issue rejected: ${message.issueId}`);
            AgentUI.loadDashboardData();
            renderNotifications(message);
            break;
        case 'issue:approval':
            console.log(`[AgentSocket] Issue approval: ${message.issueId}`);
            AgentUI.loadDashboardData();
            renderNotifications(message);
            break;
        case 'agent:status_updated':
            console.log(`[AgentSocket] Agent status updated: ${message.agentId}`);
            AgentUI.loadDashboardData();
            renderNotifications(message);
            break;
        default:
            console.log('[AgentSocket] Unhandled message type:', message.type);
    }
}


export function emitApproval(ticketId, agentId) {
    send({
        type: 'issue:approval',
        issueId: ticketId,
        agentId: agentId,
        timestamp: Date.now()
    });
}

export function emitStatusUpdate(agentId, status, agentobj) {
    send({
        type: 'agent:status_updated',
        agentId: agentId,
        status: status,
        timestamp: Date.now(),
        agentobj
    });
}

export function emitIssueCreated(issue) {
    send({
        type: 'issue:created',
        issue: issue,
        timestamp: Date.now()
    });
}

export function emitIssueResolved(issueId, agentId) {
    send({
        type: 'issue:resolved',
        issueId: issueId,
        agentId: agentId,
        timestamp: Date.now()
    });
}

export function emitIssueRejected(issueId, agentId) {
    send({
        type: 'issue:rejected',
        issueId: issueId,
        agentId: agentId,
        timestamp: Date.now()
    });
}

export function emitPollStarted() {
    send({
        type: 'poll:started',
        agentId: sessionStorage.getItem('userId'),
        timestamp: Date.now()
    });
}

export function emitPollStopped() {
    send({
        type: 'poll:stopped',
        agentId: sessionStorage.getItem('userId'),
        timestamp: Date.now()
    });
}

export function closeSocket() {
    console.log('[AgentSocket] Closing socket...');
    shouldReconnect = false;

    stopWsHealthPolling();

    if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
    }
}

export function isSocketConnected() {
    return socket && socket.readyState === WebSocket.OPEN;
}