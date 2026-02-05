/*
 * Handles all agents-related functionality
 */

import { getInitials, capitalizeFirst, debounce } from '../Utils.js';
import { filterAgents } from '../AgentSearch.js';
import { getAllAgents, getAgentById } from '../../INDEXDB/agentService.js';
import { openDB } from '../../INDEXDB/IndexDB.js';
import { initStatusUpdates } from '../../RENDERER/Supervisor/SupervisorNotifications.js'
import { errorTypeSet, InitializeErrorSet } from '../../STATE/errorState.js';
import { activeAgentMap, initializeActiveAgents } from '../../STATE/agentState.js';
// import { emitForceLogout } from '../../WS/supervisorsocket.js';

let agentsData = [];

// METRICS

async function loadAgentMetrics() {

    const total = agentsData.length;
    const availableAgents = agentsData.filter(a => a.status === 'Available').length;
    const breakAgents = agentsData.filter(a => a.status === 'Break').length;
    const offlineAgents = agentsData.filter(a => a.status === 'Offline').length;
    const onCallAgents = agentsData.filter(a => a.status === 'Busy').length;

    const totalEl = document.getElementById('totalAgentsCount');
    const activeEl = document.getElementById('activeAgentsCount');
    const breakEl = document.getElementById('breakAgentsCount');
    const offlineEl = document.getElementById('offlineAgentsCount');
    const busyEl = document.getElementById('busyAgentsCount');

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = availableAgents;
    if (breakEl) breakEl.textContent = breakAgents;
    if (offlineEl) offlineEl.textContent = offlineAgents;
    if (busyEl) busyEl.textContent = onCallAgents;
}

// AGENTS TABLE

function loadAgents(searchTerm = '') {
    console.log('loadAgents called with:', searchTerm);
    const tbody = document.getElementById('agentsTableBody');
    const noAgentsFound = document.getElementById('noAgentsFound');

    if (!tbody) return;

    let filteredAgents = [...agentsData];

    // Apply status filter
    // status filter removed

    // Apply search filter (using refined filterAgents from AgentSearch.js)
    if (searchTerm) {
        filteredAgents = filterAgents(filteredAgents, searchTerm);
    }

    if (filteredAgents.length === 0) {
        tbody.innerHTML = '';
        if (noAgentsFound) noAgentsFound.style.display = 'flex';
        return;
    }

    if (noAgentsFound) noAgentsFound.style.display = 'none';

    tbody.innerHTML = filteredAgents.map(agent => `
        <tr data-agent-id="${agent.agentId}">
            <td>
                <div class="agent-cell">
                    <div class="agent-avatar">${getInitials(agent.name)}</div>
                    <span class="agent-name">${agent.name || 'Unknown'}</span>
                </div>
            </td>
            <td>${agent.agentId}</td>
            <td>
                <span class="status-badge ${agent.status}">
                    <span class="status-dot ${agent.status}"></span>
                    ${capitalizeFirst(agent.status)}
                </span>
            </td>
            <td>${agent.totalPending || 0}</td>
            <td>${agent.totalResolved || 0}</td>
            <td>${agent.pendingApprovals || 0}</td>
            <td>
                <button class="view-agent-btn" data-agent-id="${agent.agentId}" title="View Details">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');

}

// SEARCH & FILTER

function initAgentSearch() {
    const searchInput = document.getElementById('agentSearchInput');
    const clearBtn = document.getElementById('clearAgentSearch');

    if (!searchInput) return;

    searchInput.addEventListener('input', debounce((e) => {
        const term = e.target.value.trim();
        if (clearBtn) clearBtn.style.display = term ? 'flex' : 'none';
        loadAgents(term);
    }, 300));

    clearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        loadAgents('');
        searchInput.focus();
    });
}

// AGENT DETAILS MODAL

function initAgentDetailsModal() {
    const modal = document.getElementById('agentDetailsModal');
    const closeBtn = document.getElementById('closeAgentModalBtn');
    const closeDetailsBtn = document.getElementById('closeAgentDetailsBtn');
    const forceLogoutBtn = document.getElementById('forceLogoutBtn');

    if (!modal) return;

    closeBtn?.addEventListener('click', closeAgentDetailsModal);
    closeDetailsBtn?.addEventListener('click', closeAgentDetailsModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAgentDetailsModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeAgentDetailsModal();
        }
    });

    console.log('Registering force logout click listener');

    forceLogoutBtn.onclick = () => {
        // emitForceLogout(modal.dataset.agentId);
        console.log("Force-loging out agent", modal.dataset.agentId);

        fetch('/api/polling/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: modal.dataset.agentId,
                type: 'FORCE_LOGOUT'
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Ideally show a success toast here
                    console.log('Force logout command sent successfully');
                } else {
                    console.warn('Failed to send force logout:', data.message);
                }
            })
            .catch(err => console.error('Error sending force logout:', err));
    };

}

async function openAgentDetails(agentId) {
    const agent = agentsData.find(a => a.agentId === agentId);
    if (!agent) return;

    const modal = document.getElementById('agentDetailsModal');
    // const forceLogoutBtn = document.getElementById('forceLogoutBtn');
    modal.dataset.agentId = agentId;

    // Populate modal data
    const avatarEl = document.getElementById('modalAgentAvatar');
    const nameEl = document.getElementById('modalAgentName');
    const idEl = document.getElementById('modalAgentId');
    const statusEl = document.getElementById('modalAgentStatus');
    const sinceEl = document.getElementById('modalStatusSince');
    const activeTicketsEl = document.getElementById('modalActiveTickets');
    const resolvedEl = document.getElementById('modalResolvedToday');
    const callDurationEl = document.getElementById('modalCallDuration');
    const successfullCallsEl = document.getElementById('modalSuccessfullCalls');
    const failedCallsEl = document.getElementById('modalFailedCalls');
    const successRateEl = document.getElementById('modalSuccessRate');

    if (avatarEl) avatarEl.textContent = getInitials(agent.name);
    if (nameEl) nameEl.textContent = agent.name;
    if (idEl) idEl.textContent = agent.agentId;

    if (statusEl) {
        statusEl.textContent = capitalizeFirst(agent.status);
        statusEl.className = `status-indicator ${agent.status}`;
    }

    if (sinceEl) sinceEl.textContent = `Registered Since ${new Date(agent.enrolledDate).toLocaleString() || 'N/A'}`;

    if (activeTicketsEl) activeTicketsEl.textContent = agent.totalPending || 0;

    if (resolvedEl) resolvedEl.textContent = agent.totalResolved || 0;

    if (callDurationEl) callDurationEl.textContent = agent.callduration || '0m';

    if (successfullCallsEl) successfullCallsEl.textContent = agent.successfullCalls || '0';

    if (failedCallsEl) failedCallsEl.textContent = agent.failCalls || '0';

    const worker = new Worker('../WebWorker/webworker.js');

    worker.postMessage({
        type: 'successRate',
        success: Number(agent.successfullCalls || 0),
        fail: Number(agent.failCalls || 0)
    });

    worker.onmessage = (e) => {
        const { status, successRate, message } = e.data;

        if (status === 'success') {
            if (successRateEl) successRateEl.textContent = successRate;
        } else {
            console.warn('Worker returned error:', message);
            if (successRateEl) successRateEl.textContent = '0%';
        }
        worker.terminate();
    };

    worker.onerror = (err) => {
        console.error('Worker failed:', err);
        if (successRateEl) successRateEl.textContent = '0%';
        worker.terminate();
    };

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAgentDetailsModal() {
    const modal = document.getElementById('agentDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// INITIALIZATION

export async function initAgentsTab() {
    console.log("initAgentsTab called");
    // Load fresh data
    try {
        const db = await openDB();
        agentsData = await getAllAgents(db);
        InitializeErrorSet(db);
        initializeActiveAgents(db);

        console.log("Agents data loaded successfully", agentsData);
        console.log("Errorset initialized:", errorTypeSet);
        console.log("Busy agents cache initialized:", activeAgentMap);
    } catch (err) {
        console.error("Failed to load agents in AgentsTab", err);
        agentsData = [];
    }

    loadAgentMetrics();
    loadAgents();
    initAgentSearch();
    initAgentDetailsModal();
    initAgentsTableEvents();

}

//Adding event-delegation for viewing agents
function initAgentsTableEvents() {
    const tbody = document.getElementById('agentsTableBody');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-agent-btn');
        const row = e.target.closest('tr');

        if (btn) {
            e.stopPropagation();
            const agentId = btn.dataset.agentId;
            if (agentId) openAgentDetails(agentId);
        } else if (row) {
            const agentId = row.dataset.agentId;
            if (agentId) openAgentDetails(agentId);
        }
    });
}

// Export for external access
export { loadAgentMetrics, loadAgents };
