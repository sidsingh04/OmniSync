import { formatShortDateTimeIST } from '../../scripts/Utils.js';

let pendingTicketsList = document.getElementById('pendingTicketsList');
let pendingCount = document.getElementById('pendingCount');
let approvalsList = document.getElementById('approvalsList');
let historyList = document.getElementById('historyList');
let notificationsList = document.getElementById('notificationsList');
let resolvedCount = document.getElementById('resolvedCount');
let totalPendingCount = document.getElementById('totalPendingCount');


export function renderPendingTickets(tickets) {
    pendingCount.textContent = tickets.length;

    if (tickets.length === 0) {
        pendingTicketsList.innerHTML = '<div class="empty-state">No pending tickets</div>';
        return;
    }

    pendingTicketsList.innerHTML = tickets.map(ticket => `
            <div class="ticket-item">
                <div class="list-header">
                    <span class="item-id">#${ticket.issueId}</span>
                    <span class="item-status status-${ticket.code}">Type: ${ticket.code}</span>
                </div>
                <div class="item-subject">${ticket.description}</div>
                <div class="item-meta">
                    <span>${ticket.issueDate}</span>
                </div>
                <button class="btn-view-details" data-id="${ticket.issueId}">View Details</button>
            </div>
        `).join('');
}

export function renderApprovals(approvals) {
    if (approvals.length === 0) {
        approvalsList.innerHTML = '<div class="empty-state">No pending approvals</div>';
        return;
    }

    approvalsList.innerHTML = approvals.map(approval => `
            <div class="approval-item">
                <div class="list-header">
                    <span class="item-id">${approval.issueId}</span>
                    <span class="item-status status-${approval.status}">${approval.status}</span>
                </div>
                <div class="item-subject">${approval.code}</div>
                <div class="item-meta">
                    <span>${approval.remarks}</span>
                    <span>${approval.approvalDate}</span>
                </div>
            </div>
        `).join('');
}

export function renderHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No history available</div>';
        return;
    }

    historyList.innerHTML = history.map(ticket => `
            <div class="history-item">
                <div class="list-header">
                    <span class="item-id">#${ticket.issueId}</span>
                    <span class="item-status status-${ticket.status}">${ticket.status}</span>
                </div>
                <div class="item-subject">${ticket.description}</div>
                <div class="item-meta">
                    <span>${ticket.issueDate}</span>
                </div>
            </div>
        `).join('');
}

export function initNotifications() {
    notificationsList.innerHTML = '<div class="empty-state">No new notifications</div>';
}

export function renderNotifications(message) {
    if (message.agentId !== sessionStorage.getItem('userId')) return;

    let html = '';

    if (notificationsList.innerHTML.includes('No new notifications')) {
        notificationsList.innerHTML = '';
    }

    if (message.type === 'issue:created') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon info">
                    ${getNotificationIcon('info')}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>New Ticket Created</strong></div>
                    <div class="notification-message">
                        New Ticket ${message.issueId} has been created
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
            </div>
        `;
    }
    else if (message.type === 'issue:resolved') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon success">
                    ${getNotificationIcon('success')}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>Ticket Resolved</strong></div>
                    <div class="notification-message">
                        Ticket ${message.issueId} has been approved
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
            </div>
        `;
    }
    else if (message.type === 'issue:rejected') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon warning">
                    ${getNotificationIcon('warning')}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>Ticket Rejected</strong></div>
                    <div class="notification-message">
                        Ticket ${message.issueId} has been rejected
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
            </div>
        `;
    }
    else if (message.type == 'issue:approval') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon info">
                    ${getNotificationIcon('info')}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>New Approval Request</strong></div>
                    <div class="notification-message">
                        New Approval Request for ${message.issueId} has been sent to supervisor
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
            </div>
        `;
    }

    if (!html) return;

    const notificationNode = createElementFromHTML(html);

    if (notificationNode) {
        notificationsList.prepend(notificationNode);
    }
}

function createElementFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
}

function getNotificationIcon(type) {
    const icons = {
        info: '<i class="fas fa-info-circle"></i>',
        success: '<i class="fas fa-check-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        error: '<i class="fas fa-times-circle"></i>'
    };
    return icons[type] || icons.info;
}

export function renderAnalytics(stats) {
    resolvedCount.textContent = stats.resolved;
    totalPendingCount.textContent = stats.pending;
}