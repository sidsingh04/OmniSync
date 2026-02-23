/**
 Entry point for Agent Dashboard
 */

import { AgentUI } from './AgentUI.js';
import { showToast } from '../Utils.js';
import { startLongPolling } from '../../longpoll/PollService.js';
import { initializeTheme } from '../../theme/Theme.js';
import { openDB } from '../../INDEXDB/IndexDB.js';
import { getAgentById, UpdateAgent } from '../../INDEXDB/agentService.js';
import { initAgentSocket, emitStatusUpdate } from '../../WS/agentsocket.js';
import { addToOfflineQueue } from '../../queue/OfflineQueue.js';
import { processOfflineQueue } from '../../queue/ProcessEvents.js';

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
        // let agentobj = await getAgentById(db, sessionStorage.getItem('userId'));

        let userId = sessionStorage.getItem('userId');
        let agentobj = null;

        try {
            await fetch('/api/agent/get-agent?agentId=' + userId, {
                method: 'get',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json()).then(data => {
                if (data.success) {
                    agentobj = data.agent;
                    console.log('Agent Data:', agentobj);
                } else {
                    console.error('Failed to fetch agent data:', data.message);
                }
            });
        } catch (error) {
            console.error('Error fetching agent data:', error);
        }

        if (agentobj.totalPending == '0') {
            agentobj.status = 'Available';
        } else {
            agentobj.status = 'Busy';
        }

        // await UpdateAgent(db, agentobj);

        await fetch('/api/agent/update-status', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: userId, status: agentobj.status })
        }).then(res => res.json()).then(data => {
            if (data.success) {
                console.log('Agent Data Updated:', data);
            } else {
                console.error('Failed to update agent data:', data.message);
            }
        });

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
