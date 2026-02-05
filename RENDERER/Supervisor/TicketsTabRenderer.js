// RENDER FUNCTIONS

export function renderPendingTickets(tickets) {
    const container = document.getElementById('pendingTicketsList');
    const countBadge = document.getElementById('pendingCount');

    if (!container) return;

    countBadge.textContent = tickets.length;

    if (tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No pending tickets</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-item" data-id="${ticket.issueId}">
            <div class="ticket-header">
                <span class="ticket-id">#${ticket.issueId}</span>
                <span class="ticket-priority ${ticket.code}">${ticket.code}</span>
            </div>
            <div class="ticket-subject">${ticket.description}</div>
            <div class="ticket-meta">
                <span>Agent: ${ticket.agentId}</span>
                <span>${ticket.issueDate}</span>
            </div>
        </div>
    `).join('');
}

export function renderApprovalItems(approvals) {
    const container = document.getElementById('approvalList');
    const countBadge = document.getElementById('approvalCount');

    if (!container) return;

    countBadge.textContent = approvals.length;

    if (approvals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>No items pending approval</p>
            </div>
        `;
        return;
    }

    container.innerHTML = approvals.map(approval => `
        <div class="approval-item" data-id="${approval.issueId}">
            <div class="approval-header">
                <span class="approval-id">ID: <b>${approval.issueId}</b></span>
                <span class="approval-type">Type: <b>${approval.code}</b></span>
                <span class="approval-agent">Agent: <b>${approval.agentId}</b></span>
                <span class="approval-time"><b>${approval.approvalDate}</b></span>
            </div>
            <div class="approval-details">Remarks: <b>${approval.remarks}</b></div>
            <div class="approval-actions">
                <button class="btn btn-approve" data-id="${approval.issueId}" data-agent="${approval.agentId}" data-action="approve">Approve</button>
                <button class="btn btn-reject" data-id="${approval.issueId}" data-agent="${approval.agentId}" data-action="reject">Reject</button>
                <button class="btn btn-view" data-id="${approval.issueId}" data-agent="${approval.agentId}" data-action="view">View</button>
            </div>
        </div>
    `).join('');
}
