/*
 Used across all modules
 */

import { openDB } from '../INDEXDB/IndexDB.js';
import { getAgentById, UpdateAgent } from '../INDEXDB/agentService.js';
import { emitStatusUpdate } from '../WS/agentsocket.js';
import { stopLongPolling } from '../longpoll/PollService.js';
import { getAgentsOfStatus } from '../INDEXDB/agentService.js';
import { addToOfflineQueue } from '../queue/OfflineQueue.js';
import { processOfflineQueue } from '../queue/ProcessEvents.js';


export function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}


export function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function generateId(prefix = 'ID') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp.slice(-4)}${random}`;
}

export function showToast(type, title, message) {

    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 1.5rem;
                background: #ffffff;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                z-index: 2000;
                animation: slideInRight 0.3s ease, fadeOut 0.3s ease 3.7s forwards;
            }
            .toast-notification.success { border-left: 4px solid #22c55e; }
            .toast-notification.error { border-left: 4px solid #ef4444; }
            .toast-notification.warning { border-left: 4px solid #f59e0b; }
            .toast-notification.info { border-left: 4px solid #3b82f6; }
            .toast-notification svg {
                width: 24px;
                height: 24px;
            }
            .toast-notification.success svg { color: #22c55e; }
            .toast-notification.error svg { color: #ef4444; }
            .toast-notification.warning svg { color: #f59e0b; }
            .toast-notification.info svg { color: #3b82f6; }
            .toast-content {
                display: flex;
                flex-direction: column;
            }
            .toast-content strong {
                font-size: 0.9rem;
                color: #0f172a;
            }
            .toast-content span {
                font-size: 0.8rem;
                color: #64748b;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };

    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
        ${icons[type] || icons.info}
        <div class="toast-content">
            <strong>${title}</strong>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}

export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function convertUTCToLocal(utcDate) {
    const date = new Date(utcDate);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

export function formatShortDateTimeIST(timestamp) {
    if (!timestamp) return '';

    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(timestamp));
}

export async function forceSignOut(agentId) {
    if (sessionStorage.getItem('userId') != agentId) {
        return;
    }
    const db = await openDB();
    let agent = await getAgentById(db, agentId);
    if (agent.status == 'Ofline') {
        showToast('info', 'Forced-logout-failed', 'Agent already offline');
        return;
    }
    agent.status = 'Offline';
    await UpdateAgent(db, agent);
    //offline-queue for status updates
    await addToOfflineQueue(db, {
        type: 'agent:status_updated',
        agentId: agentId,
        status: 'Offline',
        agentobj: agent
    }).then(() => processOfflineQueue(db));
    // emitStatusUpdate(agentId, 'Offline', agent);

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


    showToast('info', 'Forced Logout', 'You have been forced to logout by the supervisor!');
    sessionStorage.clear();
    window.location.replace('/');
}
