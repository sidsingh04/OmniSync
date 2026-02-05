
import { formatShortDateTimeIST } from '../../SCRIPTS/Utils.js';

// Tickets-Tab notifications:capture ticket events from agent socket

export function initTicketTabNotifications() {
    const container = document.getElementById('notificationsList');
    const countBadge = document.getElementById('notificationCount');

    if (!container) return;

    container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p>No new notifications</p>
            </div>
        `;

    countBadge.textContent = 0;
}

export function renderTicketTabNotifications(message) {
    const container = document.getElementById('notificationsList');
    const countBadge = document.getElementById('notificationCount');

    if (!container) return;

    if (container.innerHTML.includes('No new notifications')) {
        container.innerHTML = ``;
    }
    let html = '';

    if (message.type === 'issue:created') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon info">
                    ${notificationIcons.info}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>New Ticket Assigned to ${message.agentId}</strong></div>
                    <div class="notification-message">
                       Ticket ${message.issueId} has been assigned to ${message.agentId}
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
        </div>
         `;
    }
    else if (message.type === 'issue:resolved') {
        html = `
             <div class="notification-item unread">
                <div class="notification-icon info">
                    ${notificationIcons.success}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>Approval request of ${message.agentId} accepted</strong></div>
                    <div class="notification-message">
                       Ticket ${message.issueId} assigned to ${message.agentId} has been resolved.
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
        </div>
        `;
    }
    else if (message.type === 'issue:rejected') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon info">
                    ${notificationIcons.warning}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>Approval request of ${message.agentId} rejected</strong></div>
                    <div class="notification-message">
                       Approval for ticket ${message.issueId} assigned to ${message.agentId} has been rejected.
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
        </div>
        `;
    }
    else if (message.type === 'issue:approval') {
        html = `
            <div class="notification-item unread">
                <div class="notification-icon info">
                    ${notificationIcons.info}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>New Approval request from ${message.agentId}</strong></div>
                    <div class="notification-message">
                        New Approval request for ticket ${message.issueId} assigned to ${message.agentId} has been received.
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
        </div>
        `;
    }

    if (!html) return;

    const notificationNode = createElementFromHTML(html);

    if (notificationNode) {
        container.prepend(notificationNode);
        countBadge.textContent = parseInt(countBadge.textContent) + 1;
    }
}

function createElementFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
}

const notificationIcons = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
};


// Agents-Tab notifications:capture agent:status-change events from agent socket

export function initStatusUpdates() {
    const container = document.getElementById('statusUpdatesList');
    const countBadge = document.getElementById('statusUpdateCount');

    if (!container) return;

    countBadge.textContent = 0;
    container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>No recent status updates</p>
            </div>
    `;

}

export function loadStatusUpdates(message) {
    console.log('[Component Log] loadStatusUpdates called with:', message);
    const container = document.getElementById('statusUpdatesList');
    const countBadge = document.getElementById('statusUpdateCount');

    if (!container) {
        console.error('[Component Log] statusUpdatesList container not found!');
        return;
    }

    if (container.querySelector('.empty-state')) {
        console.log('[Component Log] Clearing empty state');
        container.innerHTML = '';
    }

    let html = '';
    html = `
        <div class="notification-item unread">
                <div class="notification-icon info">
                    ${notificationIcons.info}
                </div>
                <div class="notification-content">
                    <div class="notification-message"><strong>Agent Status Update for ${message.agentId}</strong></div>
                    <div class="notification-message">
                       Agent ${message.agentId} is now ${message.status}
                    </div>
                    <div class="notification-time">${formatShortDateTimeIST(message.timestamp)}</div>
                </div>
        </div>
    `;

    if (!html) return;

    console.log('[Component Log] Prepending notification');
    container.prepend(createElementFromHTML(html));
    if (countBadge) {
        const newCount = parseInt(countBadge.textContent || '0') + 1;
        countBadge.textContent = newCount;
    }
}