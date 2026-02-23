/**
 Handles all tickets-related functionality
 */

import { generateId, showToast } from '../Utils.js';
import { getAttachment } from '../../UPLOAD/download.js';
import { openDB } from '../../INDEXDB/IndexDB.js';
import { addIssues, getIssueByIssueId, getIssueByStatus, updateIssue } from "../../INDEXDB/issueService.js";
import { getAgentById, UpdateAgent } from "../../INDEXDB/agentService.js";
import { renderPendingTickets, renderApprovalItems } from '../../renderer/Supervisor/TicketsTabRenderer.js';
import { initAgentSearch, loadAgentsForSearch, clearAgentSearch } from '../AgentSearch.js';
import { emitResolved, emitRejected, emitCreated, emitStatusUpdate } from '../../WS/supervisorsocket.js';
import { errorTypeSet, registerErrorType } from '../../state/errorState.js';
import { addToOfflineQueue } from '../../queue/OfflineQueue.js';
import { processOfflineQueue } from '../../queue/ProcessEvents.js';

// DATA LOADING
export async function loadPendingTickets() {
    // const db = await openDB();
    // let tickets = await getIssueByStatus(db, "pending");
    let response = await fetch(`/api/ticket/get-by-status?status=pending`).then(res => res.json());
    let tickets = response.success ? response.tickets : [];

    const sortedTickets = [...tickets].sort(
        (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
    );
    renderPendingTickets(sortedTickets);
}

export async function loadApprovalData() {
    // const db = await openDB();
    // let approvals = await getIssueByStatus(db, "approval");
    let response = await fetch(`/api/ticket/get-by-status?status=approval`).then(res => res.json());
    let approvals = response.success ? response.tickets : [];

    const sortedApprovals = [...approvals].sort(
        (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
    );
    renderApprovalItems(sortedApprovals);
}


// ACTION HANDLERS

// function openTicketDetails(ticketId) {
//     console.log('Opening ticket:', ticketId);
//     // TODO: Implement ticket details modal or navigation
// }

async function handleApproval(approvalId, action, agentId) {
    console.log(`${action} approval: ${approvalId} for Agent: ${agentId}`);
    const db = await openDB();
    if (action === 'approve') {

        //mark-resolved
        // let ticket = await getIssueByIssueId(db, approvalId);
        // let agentobj = await getAgentById(db, ticket.agentId);
        let ticket = null;
        let agentobj = null;

        try {
            const data = await fetch(`/api/ticket/get?issueId=${approvalId}`).then(res => res.json());
            ticket = data.ticket;
            const agentData = await fetch(`/api/agent/get-agent?agentId=${ticket.agentId}`).then(res => res.json());
            agentobj = agentData.agent;
        } catch (error) {
            console.error("Error getting ticket:", error);
            return;
        }

        agentobj.totalResolved += 1;
        agentobj.successfulCalls += 1;
        agentobj.pendingApprovals -= 1;
        if (agentobj.totalPending == '0') {
            agentobj.status = 'Available';
        }
        // await UpdateAgent(db, agentobj);
        try {
            await fetch(`/api/agent/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agentobj)
            });
        } catch (error) {
            console.error("Error updating agent:", error);
        }

        ticket.status = 'resolved';
        ticket.resolvedDate = new Date().toUTCString();

        try {
            await fetch(`/api/ticket/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticket)
            });
        } catch (error) {
            console.error("Error updating ticket:", error);
        }

        // await updateIssue(db, ticket);
        // emitResolved(approvalId, agentId);
        // emitStatusUpdate(agentId, agentobj.status);

        await addToOfflineQueue(db, {
            type: 'issue:resolved',
            issueId: approvalId,
            agentId: agentId
        });

        await addToOfflineQueue(db, {
            type: 'agent:status_updated',
            agentId: agentId,
            status: agentobj.status,
            agentobj: agentobj
        });

        await processOfflineQueue(db);

        showToast('success', 'Approved', `Request #${approvalId} for Agent ${agentId} has been approved`);
    } else {


        // let ticket = await getIssueByIssueId(db, approvalId);
        // let agentobj = await getAgentById(db, ticket.agentId);

        let ticket = null;
        let agentobj = null;

        try {
            const data = await fetch(`/api/ticket/get?issueId=${approvalId}`).then(res => res.json());
            ticket = data.ticket;
            const agentData = await fetch(`/api/agent/get-agent?agentId=${ticket.agentId}`).then(res => res.json());
            agentobj = agentData.agent;
        } catch (error) {
            console.error("Error getting ticket:", error);
        }

        agentobj.failedCalls += 1;
        agentobj.pendingApprovals -= 1;
        agentobj.totalPending += 1;
        agentobj.status = 'Busy';

        // await UpdateAgent(db, agentobj);

        try {
            await fetch(`/api/agent/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agentobj)
            });
        } catch (error) {
            console.error("Error updating agent:", error);
        }

        ticket.status = 'pending';
        ticket.approvalDate = null;
        // await updateIssue(db, ticket);

        try {
            await fetch(`/api/ticket/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticket)
            });
        } catch (error) {
            console.error("Error updating ticket:", error);
        }

        // emitRejected(approvalId, agentId);
        // emitStatusUpdate(agentId, agentobj.status);

        await addToOfflineQueue(db, {
            type: 'issue:rejected',
            issueId: approvalId,
            agentId: agentId
        });

        await addToOfflineQueue(db, {
            type: 'agent:status_updated',
            agentId: agentId,
            status: agentobj.status,
            agentobj: agentobj
        });

        await processOfflineQueue(db);

        showToast('warning', 'Rejected', `Request #${approvalId} for Agent ${agentId} has been rejected`);
    }

    // Refresh the approval list
    loadApprovalData();
}

async function viewApprovalDetails(approvalId) {
    console.log('Viewing approval details:', approvalId);

    console.log('Fetching attachment for:', approvalId);
    try {
        const attachment = await getAttachment(approvalId);
        console.log('Attachment result:', attachment);

        if (!attachment) {
            console.warn('No attachment found for', approvalId);
            showToast('info', 'No Attachment', 'No file attached to this request.');
            return;
        }

        const modal = document.getElementById('attachmentViewModal');
        const modalBody = document.getElementById('attachmentModalBody');
        const closeBtn = document.getElementById('closeAttachmentModalBtn');
        const attachmentTitle = document.getElementById('attachmentTitle');

        attachmentTitle.textContent = `Attachment Viewer - ${approvalId}`;

        if (!modal || !modalBody) {
            console.error('Modal DOM elements missing!');
            return;
        }

        modalBody.innerHTML = '';
        const url = URL.createObjectURL(attachment.blob);

        if (attachment.fileType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '80vh';
            modalBody.appendChild(img);
        } else if (attachment.fileType.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = url;
            modalBody.appendChild(audio);
        } else {
            modalBody.textContent = `File type: ${attachment.fileType} not supported for preview.`;
        }

        modal.classList.add('active');

        // Close handlers
        const closeModal = () => {
            modal.classList.remove('active');
            modalBody.innerHTML = '';
            URL.revokeObjectURL(url);
        };

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

    } catch (error) {
        console.error('Error viewing attachment:', error);
        showToast('error', 'Error', 'Failed to retrieve attachment.');
    }
}
// MODAL FUNCTIONS

function initCreateTicketModal() {
    const modal = document.getElementById('createTicketModal');
    const createBtn = document.getElementById('createTicketBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelTicketBtn');
    const form = document.getElementById('createTicketForm');
    const agentSearchInput = document.getElementById('ticketAgentSearchInput');
    const agentSearchResults = document.getElementById('agentSearchResults');
    const selectedAgentId = document.getElementById('selectedAgentId');

    if (!modal || !createBtn) return;

    createBtn.addEventListener('click', () => {
        loadAgentsForSearch();
        openModal();
    });
    closeBtn?.addEventListener('click', () => closeModal());
    cancelBtn?.addEventListener('click', () => closeModal());

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateTicketForm()) {
            handleCreateTicket();
        }
    });

    // Initialize agent search
    initAgentSearch(agentSearchInput, agentSearchResults, selectedAgentId);
}

function validateTicketForm() {
    const form = document.getElementById('createTicketForm');
    const typeIssue = form.querySelector('#ticketTypeIssue').value;
    const description = form.querySelector('#ticketDescription').value.trim();
    // const callDuration = form.querySelector('#callDuration').value;
    const selectedAgentId = document.getElementById('selectedAgentId').value;

    let isValid = true;
    let errorMessage = '';

    if (!typeIssue) {
        isValid = false;
        errorMessage = 'Please select an issue type.';
    } else if (!description) {
        isValid = false;
        errorMessage = 'Please enter a description.';
    } else if (!selectedAgentId) {
        isValid = false;
        errorMessage = 'Please select an agent.';
    }

    if (!isValid) {
        showToast('error', 'Validation Error', errorMessage);
        return false;
    }

    return true;
}

function openModal() {
    const modal = document.getElementById('createTicketModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        document.getElementById('ticketTypeIssue')?.focus();
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('createTicketModal');
    const form = document.getElementById('createTicketForm');
    const agentSearchInput = document.getElementById('ticketAgentSearchInput');
    const agentSearchResults = document.getElementById('agentSearchResults');
    const selectedAgentId = document.getElementById('selectedAgentId');

    modal.classList.remove('active');
    document.body.style.overflow = '';
    form?.reset();

    // Clear agent search
    clearAgentSearch(agentSearchInput, agentSearchResults, selectedAgentId);
}

async function handleCreateTicket() {
    const form = document.getElementById('createTicketForm');
    const formData = new FormData(form);

    const ticketData = {
        issueId: generateId('TKT'),
        code: formData.get('typeIssue'),
        description: formData.get('description'),
        callDuration: null,
        agentId: formData.get('assignAgent'),
        status: 'pending',
        issueDate: new Date().toUTCString(),
        resolvedDate: null
    };

    console.log('Creating ticket:', ticketData);
    const db = await openDB();
    registerErrorType(ticketData.code);

    try {
        await fetch("/api/ticket/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ticketData)
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        showToast('error', 'Error', 'Failed to create ticket.');
    }

    // await addIssues(db, ticketData);
    // let agentobj = await getAgentById(db, ticketData.agentId);

    let agentobj = null;
    try {
        await fetch('/api/agent/get-agent?agentId=' + ticketData.agentId, {
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
        showToast('error', 'Error', 'Failed to fetch agent data.');
    }

    agentobj.totalPending += 1;

    addToOfflineQueue(db, {
        type: 'agent:status_updated',
        agentId: ticketData.agentId,
        status: 'Busy',
        agentobj: agentobj
    });

    addToOfflineQueue(db, {
        type: 'issue:created',
        payload: {
            agentId: ticketData.agentId,
            issueId: ticketData.issueId,
            ...ticketData
        }
    }).then(() => processOfflineQueue(db));

    agentobj.status = 'Busy';
    // await UpdateAgent(db, agentobj);
    try {
        await fetch('/api/agent/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agentobj)
        }).then(res => res.json()).then(data => {
            if (data.success) {
                console.log('Agent updated successfully');
            } else {
                console.error('Failed to update agent:', data.message);
            }
        });
    } catch (error) {
        console.error('Error updating agent:', error);
        showToast('error', 'Error', 'Failed to update agent.');
    }

    showToast('success', 'Ticket Created Successfully', `Ticket #${ticketData.issueId} has been raised`);
    closeModal();

    // Refresh the pending tickets list
    loadPendingTickets();
}

// INITIALIZATION

function initApprovalActions() {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    approvalList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const agentId = btn.dataset.agent;

        console.log('Approval Action Clicked:', action, id, agentId);

        if (!action || !id) return;

        e.stopPropagation();

        if (action === 'approve') {
            handleApproval(id, 'approve', agentId);
        } else if (action === 'reject') {
            handleApproval(id, 'reject', agentId);
        } else if (action === 'view') {
            viewApprovalDetails(id);
        }
    });
}

export function initTicketsTab() {
    initCreateTicketModal();
    initApprovalActions();
    loadPendingTickets();
    loadApprovalData();
}

