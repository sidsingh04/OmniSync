/*
  Coordinates all tab modules and handles global functionality
 */

import { initTicketsTab } from './TicketsTab.js';
import { initAgentsTab } from './AgentsTab.js';
import { initAnalyticsTab } from './AnalyticsTab.js';
import { initSupervisorSocket } from '../../WS/supervisorsocket.js';
import { initStatusUpdates, initTicketTabNotifications } from '../../RENDERER/Supervisor/SupervisorNotifications.js';
import { initConnectionLights } from '../LIGHTS/ConnectionLights.js';

// TAB NAVIGATION

function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${targetTab}-content`)?.classList.add('active');
        });
    });
}

// SIGN OUT

function initSignOut() {
    const signOutBtn = document.getElementById('signOutBtn');

    signOutBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
            sessionStorage.clear();
            window.location.replace('./Login.html');
        }
    });
}


// INITIALIZATION

export function initDashboard() {
    console.log('Initializing Supervisor Dashboard...');

    try {
        // Prevent back navigation
        history.pushState(null, null, location.href);
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', () => {
            history.pushState(null, null, location.href);
        });

        // Initialize global components
        initTabNavigation();
        initSignOut();

        console.log('Initializing Connection Lights...');
        initConnectionLights();

        initSupervisorSocket();

        // Initialize tab modules
        console.log('Initializing TicketsTab...');
        initTicketsTab();
        console.log('Initializing AgentsTab...');
        initAgentsTab();

        console.log('Initializing Status Updates...');
        initStatusUpdates();
        // Expose to window for UI onclick events
        window.initStatusUpdates = initStatusUpdates;
        window.initTicketTabNotifications = initTicketTabNotifications;

        console.log('Initializing AnalyticsTab...');
        initAnalyticsTab();

        console.log('Supervisor Dashboard initialized successfully');
    } catch (error) {
        console.error('Critical Error in Supervisor Dashboard Initialization:', error);
    }

    console.log('Supervisor Dashboard initialized successfully');
}
