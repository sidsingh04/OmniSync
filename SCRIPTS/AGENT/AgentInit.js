/**
 Entry point for Agent Dashboard
 */

import { AgentUI } from './AgentUI.js';
import { showToast } from '../Utils.js';
import { startLongPolling } from '../../LONGPOLL/PollService.js';
import { initializeTheme } from '../../THEME/Theme.js';
import { openDB } from '../../INDEXDB/IndexDB.js';
import { getAgentById, UpdateAgent } from '../../INDEXDB/agentService.js';
import { initAgentSocket, emitStatusUpdate } from '../../WS/agentsocket.js';
import { addToOfflineQueue } from '../../QUEUE/OfflineQueue.js';
import { processOfflineQueue } from '../../QUEUE/ProcessEvents.js';

const initDashboard = async () => {
    try {
        console.log('Initializing Agent Dashboard...');

        // Prevent back navigation
        history.pushState(null, null, location.href);
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', () => {
            history.pushState(null, null, location.href);
        });

        initializeTheme();
        initAgentSocket();
        const db = await openDB();
        let agentobj = await getAgentById(db, sessionStorage.getItem('userId'));
        if (agentobj.totalPending == '0') {
            agentobj.status = 'Available';
        } else {
            agentobj.status = 'Busy';
        }
        await UpdateAgent(db, agentobj);
        AgentUI.init();
        startLongPolling(agentobj.agentId);

        addToOfflineQueue(db, {
            type: 'agent:status_updated',
            agentId: agentobj.agentId,
            status: agentobj.status,
            agentobj: agentobj
        }).then(() => processOfflineQueue(db));

        // emitStatusUpdate(agentobj.agentId, agentobj.status);
        showToast('success', 'Welcome', 'Agent Dashboard Loaded successfully');
    } catch (error) {
        console.error('Failed to initialize Agent Dashboard:', error);
        showToast('error', 'Initialization Error', 'Failed to load dashboard. Check console.');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
