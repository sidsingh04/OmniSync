/**
  Handles UI interactions and rendering for Agent Dashboard
 */
import { openDB } from '../../INDEXDB/IndexDB.js';
import { getAgentById, UpdateAgent, getAgentsOfStatus } from '../../INDEXDB/agentService.js';
import { showToast, formatRelativeTime, getInitials } from '../Utils.js';
import { getIssueByAgentId, getIssueByStatus, updateIssue } from '../../INDEXDB/issueService.js';
import { renderPendingTickets, renderApprovals, renderHistory, renderAnalytics } from '../../renderer/Agent/AgentRenderer.js';
import { emitApproval, closeSocket, emitStatusUpdate } from '../../WS/agentsocket.js';
import { initMultipartUpload, saveAttachment, resetAttachment } from '../../UPLOAD/upload.js';
import { processOfflineQueue } from '../../queue/ProcessEvents.js';
import { addToOfflineQueue } from '../../queue/OfflineQueue.js';
import { stopLongPolling } from '../../longpoll/PollService.js';

let agentName = document.getElementById('agentName');
let agentId = document.getElementById('agentId');
let agentInitials = document.getElementById('agentInitials');
let signOutBtn = document.getElementById('signOutBtn');
let tabs = document.querySelectorAll('.tab-btn');
let tabPanes = document.querySelectorAll('.tab-pane');
let ticketSearchInput = document.getElementById('ticketSearchInput');
let pendingTicketsList = document.getElementById('pendingTicketsList');
let pendingCount = document.getElementById('pendingCount');
let approvalsList = document.getElementById('approvalsList');
let historyList = document.getElementById('historyList');
let notificationsList = document.getElementById('notificationsList');
let resolvedCount = document.getElementById('resolvedCount');
let totalPendingCount = document.getElementById('totalPendingCount');
let clearNotifications = document.getElementById('clearNotifications');
let agentStatus = document.getElementById('agentStatusText');
let breakBtn = document.getElementById('breakBtn');

let signingout = false;

export const AgentUI = {
    init() {
        this.bindEvents();
        this.renderInitialState();
        signingout = false;
        initMultipartUpload('approvalAttachment', 'attachmentPreview');
    },

    bindEvents() {

        signOutBtn.addEventListener('click', async () => {
            if (signingout) {
                showToast('error', 'Action Restricted', 'You cannot sign out while signing out.');
                return;
            }

            const db = await openDB();
            let userId = sessionStorage.getItem('userId');
            let agent = null;
            try {
                await fetch('/api/agent/get-agent?agentId=' + userId, {
                    method: 'get',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json()).then(data => {
                    if (data.success) {
                        agent = data.agent;
                    }
                });
            }
            catch (e) {
                console.log("Agent-Status not fetched from DB");
            }

            // let agent = await getAgentById(db, userId);
            if (agent.status === 'Break') {
                showToast('error', 'Action Restricted', 'You cannot sign out while on break.');
                return;
            }

            // emitStatusUpdate(agentId, 'Offline', agent);


            agent.status = 'Offline';
            signingout = true;
            // await UpdateAgent(db, agent);

            addToOfflineQueue(db, {
                type: 'agent:status_updated',
                agentId: userId,
                status: 'Offline',
                agentobj: agent
            }).then(() => processOfflineQueue(db));

            // For now it's here would fire when all the agents are offline
            Promise.all([
                getAgentsOfStatus(db, 'Available'),
                getAgentsOfStatus(db, 'Break'),
                getAgentsOfStatus(db, 'Busy')
            ]).then(([availaibleAgents, breakAgents, busyAgents]) => {
                console.log(availaibleAgents.length + breakAgents.length + busyAgents.length);
                if (availaibleAgents.length + breakAgents.length + busyAgents.length == 0) {
                    stopLongPolling();
                }
            });

            try {
                await fetch('/api/agent/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: userId, status: 'Offline' })
                });
            } catch (e) { console.error("MongoDB update failed", e); }


            showToast('info', 'Signing Out', 'Goodbye!');
            setTimeout(() => {
                sessionStorage.clear();
                window.location.replace('Login.html');
                closeSocket();
                signingout = false;
            }, 1000);
        });


        if (breakBtn) {
            breakBtn.addEventListener('click', () => {
                this.toggleBreak();
            });
        }


        clearNotifications.addEventListener('click', () => {
            showToast('info', 'Notifications Cleared', 'All notifications have been cleared.');
            notificationsList.innerHTML = '<div class="empty-state">No new notifications</div>';
        });

        // Tab Switching using Event Delegation
        const tabsContainer = document.querySelector('.tabs-nav');
        tabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-btn');
            if (!clickedTab) return;

            const tabId = clickedTab.dataset.tab;
            this.switchTab(tabId);
        });

        // Modal Elements
        const modal = document.getElementById('ticketDetailsModal');
        const closeModalBtn = document.querySelector('.close-modal');
        const closeBtn = document.getElementById('closeModalBtn');
        const sendApprovalBtn = document.getElementById('sendApprovalBtn');

        // Ticket Search
        ticketSearchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // View Details Button Delegation
        pendingTicketsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-view-details')) {
                if (agentStatus.textContent === 'Break') {
                    showToast('error', 'Action Restricted', 'You cannot view ticket details while on break.');
                    return;
                }
                const ticketId = e.target.dataset.id;
                this.openTicketModal(ticketId);
            }
        });

        // Modal Controls
        const closeModal = () => {
            modal.classList.remove('active');
            // Clear inputs
            document.getElementById('ticketRemarks').value = '';
            document.getElementById('ticketCallDuration').value = '';
            document.getElementById('approvalAttachment').value = '';
            resetAttachment('attachmentPreview');
        };

        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Send for Approval
        if (sendApprovalBtn) {
            sendApprovalBtn.addEventListener('click', async () => {

                const currentStatus = agentStatus.textContent;
                if (currentStatus === 'Break') {
                    showToast('error', 'Action Restricted', 'You cannot send tickets for approval while on break.');
                    return;
                }

                const ticketId = document.getElementById('modalTicketId').textContent;
                const remarks = document.getElementById('ticketRemarks').value.trim();
                const duration = document.getElementById('ticketCallDuration').value;

                if (!remarks) {
                    showToast('error', 'Validation Error', 'Please enter remarks before sending for approval.');
                    return;
                }

                if (!duration || duration < 0) {
                    showToast('error', 'Validation Error', 'Please enter a valid call duration.');
                    return;
                }

                try {
                    const db = await openDB();
                    //for getting the required ticket we can direct query on the issueId and save some-time.
                    // let tickets = await getIssueByAgentId(db, sessionStorage.getItem('userId'));
                    // let agent = await getAgentById(db, sessionStorage.getItem('userId'));

                    let tickets = null;

                    try {
                        const response = await fetch(`/api/ticket/get-by-agentId?agentId=${sessionStorage.getItem('userId')}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        });
                        const data = await response.json();
                        tickets = data.success ? data.tickets : [];
                    }
                    catch (error) {
                        console.error("Error getting tickets:", error);
                        return;
                    }

                    let agent = null;
                    try {
                        const response = await fetch(`/api/agent/get-agent?agentId=${sessionStorage.getItem('userId')}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        });
                        const data = await response.json();
                        agent = data.success ? data.agent : null;

                        if (!agent) {
                            console.error("Agent not found in database payload");
                            return;
                        }
                    } catch (error) {
                        console.error("Error getting agent:", error);
                        return;
                    }

                    agent.totalCallDuration += parseInt(duration, 10);
                    let ticket = tickets.find(t => t.issueId === ticketId);

                    if (ticket) {
                        ticket.status = 'approval';
                        ticket.remarks = remarks;
                        ticket.callDuration = parseInt(duration, 10);
                        ticket.approvalDate = new Date().toUTCString();

                        agent.pendingApprovals += 1;
                        agent.totalPending -= 1;

                        if (agent.totalPending == 0) {
                            // emitStatusUpdate(agentId, 'Available', agent);
                            agent.status = 'Available';

                            await addToOfflineQueue(db, {
                                type: 'agent:status_updated',
                                agentId: sessionStorage.getItem('userId'),
                                status: 'Available',
                                agentobj: agent
                            });
                        }

                        // await updateIssue(db, ticket);
                        try {
                            await fetch('/api/ticket/update', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(ticket)
                            });
                        }
                        catch (error) {
                            console.error("Error updating ticket:", error);
                            return;
                        }

                        await saveAttachment(ticketId, sessionStorage.getItem('userId'));

                        // await UpdateAgent(db, agent);
                        try {
                            await fetch('/api/agent/update', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(agent)
                            });
                        } catch (error) {
                            console.error("Error updating agent:", error);
                            return;
                        }

                        // emitApproval(ticketId, sessionStorage.getItem('userId')); 

                        await addToOfflineQueue(db, {
                            type: 'issue:approval',
                            issueId: ticketId,
                            agentId: sessionStorage.getItem('userId')
                        });

                        await processOfflineQueue(db);

                        showToast('success', 'Sent for Approval', `Ticket #${ticketId} sent to supervisor.`);
                        resetAttachment('attachmentPreview');
                        closeModal();
                        this.loadDashboardData();
                    }
                } catch (error) {
                    console.error('Error sending for approval:', error);
                    showToast('error', 'Error', 'Failed to update ticket status.');
                }
            });
        }
    },

    async renderInitialState() {
        await this.renderAgentInfo();
        await this.loadDashboardData();
    },

    async renderAgentInfo() {
        const agentid = sessionStorage.getItem('userId');
        // const db = await openDB();
        // const agent = await getAgentById(db, agentid);
        let agent = await fetch('/api/agent/get-agent?agentId=' + agentid)
            .then(res => res.json())
            .then(data => data.agent);

        if (!agent) {
            console.error("Agent not found in database payload");
            return;
        }
        agentName.textContent = agent.name;
        agentId.textContent = `ID: ${agentid}`;
        agentInitials.textContent = getInitials(agent.name);
        agentStatus.textContent = agent.status;


        if (breakBtn) {
            if (agent.status === 'Break') {
                breakBtn.innerHTML = '<i class="fas fa-play"></i> End Break';
                breakBtn.classList.add('active');
            } else {
                breakBtn.innerHTML = '<i class="fas fa-coffee"></i> Take Break';
                breakBtn.classList.remove('active');
            }
        }
    },

    async toggleBreak() {
        const db = await openDB();
        const userId = sessionStorage.getItem('userId');

        let agent = await fetch('/api/agent/get-agent?agentId=' + userId)
            .then(res => res.json())
            .then(data => data.agent);

        if (agent.status !== 'Break') {
            // Start Break
            agent.status = 'Break';

            try {
                await fetch('/api/agent/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(agent)
                });
            } catch (e) { console.error("MongoDB update failed", e); }

            agentStatus.textContent = 'Break';
            breakBtn.innerHTML = '<i class="fas fa-play"></i> End Break';
            breakBtn.classList.add('active');

            addToOfflineQueue(db, {
                type: 'agent:status_updated',
                agentId: userId,
                status: 'Break',
                agentobj: agent
            }).then(() => processOfflineQueue(db));

            showToast('info', 'On Break', 'You are now on break.');
        } else {
            let tickets = await fetch('/api/ticket/get-by-agentId?agentId=' + userId)
                .then(res => res.json())
                .then(data => data.tickets);

            let pendingTickets = tickets.filter(ticket => ticket.status === 'pending');

            if (pendingTickets.length > 0) {
                agent.status = 'Busy';
            } else {
                agent.status = 'Available';
            }

            try {
                await fetch('/api/agent/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(agent)
                });
            } catch (e) { console.error("MongoDB update failed", e); }

            addToOfflineQueue(db, {
                type: 'agent:status_updated',
                agentId: userId,
                status: agent.status,
                agentobj: agent
            }).then(() => processOfflineQueue(db));

            agentStatus.textContent = agent.status;
            breakBtn.innerHTML = '<i class="fas fa-coffee"></i> Take Break';
            breakBtn.classList.remove('active');
            showToast('success', 'Back Online', `You are now ${agent.status}.`);
        }
    },

    async openTicketModal(ticketId) {
        const db = await openDB();
        const agentId = sessionStorage.getItem('userId');
        let tickets = await fetch('/api/ticket/get-by-agentId?agentId=' + agentId)
            .then(res => res.json())
            .then(data => data.tickets);

        let ticket = tickets.find(t => t.issueId === ticketId);

        if (ticket) {
            document.getElementById('modalTicketId').textContent = ticket.issueId;
            document.getElementById('modalTicketIssue').textContent = ticket.code;
            document.getElementById('modalTicketDesc').textContent = ticket.description;
            // document.getElementById('modalTicketCustomer').textContent = ticket.customerName || 'N/A';

            const modal = document.getElementById('ticketDetailsModal');
            modal.classList.add('active');

            const remarksInput = document.getElementById('ticketRemarks');

            if (agentStatus.textContent === 'Break') {
                remarksInput.disabled = true;
                remarksInput.placeholder = "Action disabled while on break.";
            } else {
                remarksInput.disabled = false;
                remarksInput.placeholder = "Enter resolution details or remarks...";
            }
        }
    },

    async loadDashboardData() {
        // Load Pending Tickets
        // const db = await openDB();
        const agentId = sessionStorage.getItem('userId');
        // let agent = await getAgentById(db, agentId);
        // let tickets = await getIssueByAgentId(db, agentId);
        let agent = null;
        let tickets = null;
        try {
            agent = await fetch('/api/agent/get-agent?agentId=' + agentId)
                .then(res => res.json())
                .then(data => data.agent);

            tickets = await fetch('/api/ticket/get-by-agentId?agentId=' + agentId)
                .then(res => res.json())
                .then(data => data.tickets);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }

        agentStatus.textContent = agent.status;

        let pendingTickets = tickets.filter(ticket => ticket.status === 'pending');
        renderPendingTickets(pendingTickets);

        // Load Approvals
        let approvalTickets = tickets.filter(ticket => ticket.status === 'approval');
        approvalTickets.sort((a, b) => new Date(b.approvalDate) - new Date(a.approvalDate));
        renderApprovals(approvalTickets);

        // Show all tickets in their current statuses
        let tempTickets = tickets;
        tempTickets.sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate));
        renderHistory(tempTickets);

        // Load Analytics
        let resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved');
        renderAnalytics({ resolved: resolvedTickets.length, pending: pendingTickets.length, approvals: approvalTickets.length });
    },

    switchTab(tabId) {
        // Update Tab Buttons
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update Tab Panes
        tabPanes.forEach(pane => {
            if (pane.id === `${tabId}Tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    },


    handleSearch(query) {
        const searchTerm = query.toLowerCase();
        //filter the DOM elements in pending list for now

        const pendingItems = pendingTicketsList.querySelectorAll('.ticket-item');
        let hasVisible = false;

        pendingItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
                hasVisible = true;
            } else {
                item.style.display = 'none';
            }
        });

        if (!hasVisible && pendingItems.length > 0) {
            //show-nothing when no matches
        }
    }
};
