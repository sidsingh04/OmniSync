import { forceSignOut, showToast } from '../SCRIPTS/Utils.js';
import { openDB } from '../INDEXDB/IndexDB.js';
import { updateConnectionStatus } from '../SCRIPTS/LIGHTS/ConnectionLights.js';
import { emitPollStarted, emitPollStopped } from '../WS/agentsocket.js';
import { addToOfflineQueue } from '../QUEUE/OfflineQueue.js';
import { processOfflineQueue } from '../QUEUE/ProcessEvents.js';

let isPolling = false;
let forceLogoutHandled = false;
let isHealthy = false;

const handledEventIds = new Set();

export async function triggerLongPollEvent(agentId, type, message) {
    try {
        const response = await fetch('/api/polling/trigger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agentId, type, message })
        });
        return await response.json();
    } catch (error) {
        console.error('Error triggering long poll event:', error);
    }
}

export function startLongPolling(agentId) {
    if (isPolling) {
        console.warn('Long polling is already active.');
        return;
    }

    console.log(`Starting long polling for agent: ${agentId}`);
    isPolling = true;
    console.log('[PollService] Setting LP status to active');
    // updateConnectionStatus('lp', 'active');
    poll(agentId);
    // emitPollStarted();
    // emitPollStarted();
    openDB().then(async db => {
        await addToOfflineQueue(db, {
            type: 'poll:started',
            agentId: agentId,
            timestamp: Date.now()
        });
        await processOfflineQueue(db);
    });
}

export function stopLongPolling() {
    console.log('Stopping long polling.');
    isPolling = false;
    isHealthy = false;
    // updateConnectionStatus('lp', 'inactive');
    // emitPollStopped();
    // emitPollStopped();
    openDB().then(async db => {
        await addToOfflineQueue(db, {
            type: 'poll:stopped',
            agentId: sessionStorage.getItem('userId'),
            timestamp: Date.now()
        });
        await processOfflineQueue(db);
    });
}

export function isLongPollHealthy() {
    return isHealthy;
}

async function poll(agentId) {
    if (!isPolling) return;

    try {
        const response = await fetch(
            `/api/polling/updates?agentId=${agentId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (response.ok) {
            if (response.status !== 204) {
                const data = await response.json();
                handlePollData(data, agentId);
            }
            isHealthy = true;
        } else {
            isHealthy = false;
        }
    } catch (error) {
        console.error('Polling error:', error);
        isHealthy = false;
    } finally {
        // re-open the long poll
        if (isPolling) {
            poll(agentId);
        }
    }
}


function handlePollData(data, agentId) {
    if (!data) return;

    const events = Array.isArray(data) ? data : [data];

    events.forEach(event => {

        if (event.eventId && handledEventIds.has(event.eventId)) {
            console.warn('Duplicate event ignored:', event.eventId);
            return;
        }

        if (event.eventId) {
            handledEventIds.add(event.eventId);
        }

        switch (event.type) {
            case 'FORCE_LOGOUT':
                if (forceLogoutHandled) {
                    console.warn('FORCE_LOGOUT already handled');
                    return;
                }

                console.log('Received FORCE_LOGOUT event via long poll');
                forceLogoutHandled = true;
                forceSignOut(agentId);
                break;

            case 'WHISPER':
                console.log('Received WHISPER event via long poll');
                if (event.message) {
                    showToast('info', 'Supervisor Whisper', event.message);
                }
                break;

            default:
                // Unknown event type 
                break;
        }
    });
}

