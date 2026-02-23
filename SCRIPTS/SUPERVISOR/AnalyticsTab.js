/*
 Handles logic for the Supervisor Analytics Tab
 */

import { updateMonthlyIssueChart, initMonthlyIssueChart, destroyMonthlyIssueChart } from '../../charts/MonthlyIssueChart.js';
import { updateResolvedMonthlyIssueChart, initResolvedMonthlyIssueChart, destroyResolvedMonthlyIssueChart } from '../../charts/MonthlyResolvedChart.js';
import { errorTypeSet } from '../../state/errorState.js';

export function initAnalyticsTab() {
    console.log('Initializing Analytics Tab...');
    loadAnalyticsData();

    // Add event listener for tab switch to refresh data
    const analyticsTabBtn = document.querySelector('button[data-tab="analytics"]');
    if (analyticsTabBtn) {
        analyticsTabBtn.addEventListener('click', () => {
            loadAnalyticsData();
        }, { once: true });
    }
}

async function loadAnalyticsData() {
    try {
        // const db = await openDB();
        // const tickets = await getAllIssues(db);
        let tickets = await fetch('/api/ticket/get-all')
            .then(res => res.json())
            .then(data => data.success ? data.tickets : []);

        // Calculate stats
        const stats = calculateStats(tickets);

        // Clean up old charts
        destroyMonthlyIssueChart();
        destroyResolvedMonthlyIssueChart();

        // Render the UI
        renderAnalytics(stats);

        // Initialize and update charts
        initMonthlyIssueChart();
        initResolvedMonthlyIssueChart();

        updateMonthlyIssueChart(tickets);
        const resolvedTickets = tickets.filter(t => t.status === 'resolved');
        updateResolvedMonthlyIssueChart(resolvedTickets);


    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

function calculateStats(tickets) {
    let resolved = 0;
    let pending = 0;
    let approvals = 0;
    let issueTypes = {};

    tickets.forEach(ticket => {

        if (ticket.status === 'resolved') resolved++;
        if (ticket.status === 'pending') pending++;
        if (ticket.status === 'approval') approvals++;

        // Count Issue Types (normalize to lowercase)
        const type = ticket.typeIssue ? ticket.typeIssue.toLowerCase() : 'other';
        if (issueTypes[type]) {
            issueTypes[type]++;
        } else {
            issueTypes[type] = 1;
        }
    });

    return {
        resolved,
        pending,
        approvals,
        issueTypes
    };
}

function renderAnalytics(stats) {
    const container = document.getElementById('analytics-content');
    if (!container) return;

    container.innerHTML = `
        <div class="analytics-dashboard">
            <!-- Summary Cards -->
            <div class="analytics-summary">
                <div class="stat-card resolved">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <h3>${stats.resolved}</h3>
                        <p>Total Resolved</p>
                    </div>
                </div>
                <div class="stat-card pending">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <h3>${stats.pending}</h3>
                        <p>Total Pending</p>
                    </div>
                </div>
                <div class="stat-card approval">
                    <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
                    <div class="stat-info">
                        <h3>${stats.approvals}</h3>
                        <p>Total Approvals</p>
                    </div>
                </div>
                <div class="stat-card approval">
                    <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
                    <div class="stat-info">
                        <h3>${errorTypeSet.size}</h3>
                        <p>Distinct Errors</p>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="analytics-charts-container" style="display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap;">
                <!-- Monthly Issue Chart -->
                <div class="chart-wrapper" style="flex: 1; min-width: 400px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div class="chart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: #1e293b;">Monthly Issues</h4>
                        <select id="issueMonthSelector" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; outline: none;"></select>
                    </div>
                    <canvas id="issuedChart"></canvas>
                </div>

                <!-- Monthly Resolved Chart -->
                <div class="chart-wrapper" style="flex: 1; min-width: 400px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div class="chart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: #1e293b;">Monthly Resolved</h4>
                        <select id="resolvedMonthSelector" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; outline: none;"></select>
                    </div>
                    <canvas id="resolvedChart"></canvas>
                </div>
            </div>
        </div>
    `;
}

function capitalize(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}
