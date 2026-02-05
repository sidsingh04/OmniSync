let resolvedChart;
let cachedResolvedIssues = [];

function getResolvedDate(issue) {
    if (!issue?.resolvedDate && !issue?.issueDate) return new Date(NaN);
    return new Date(issue.resolvedDate || issue.issueDate);
}

export function initResolvedMonthlyIssueChart() {
    if (resolvedChart) return;

    const canvas = document.getElementById("resolvedChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    resolvedChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "Resolved Tickets",
                data: [],
                backgroundColor: "#16a34a"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });

    const selector = document.getElementById("resolvedMonthSelector");
    if (selector && !selector.dataset.bound) {
        selector.addEventListener("change", e => {
            renderResolvedMonth(e.target.value);
        });
        selector.dataset.bound = "true";
    }
}

export function destroyResolvedMonthlyIssueChart() {
    if (resolvedChart) {
        resolvedChart.destroy();
        resolvedChart = null;
    }
}

export function updateResolvedMonthlyIssueChart(resolvedIssues) {
    if (!resolvedChart) return;

    cachedResolvedIssues = resolvedIssues;
    populateResolvedMonthDropdown(resolvedIssues);

    const selector = document.getElementById("resolvedMonthSelector");
    if (!selector || !selector.value) return;

    renderResolvedMonth(selector.value);
}

function renderResolvedMonth(monthKey) {
    if (!resolvedChart) return;

    const dailyCounts = {};

    for (const issue of cachedResolvedIssues) {
        const dateObj = getResolvedDate(issue);
        if (isNaN(dateObj)) continue;

        const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
        if (key !== monthKey) continue;

        const day = dateObj.getDate();
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    const days = Object.keys(dailyCounts).sort((a, b) => a - b);
    const values = days.map(d => dailyCounts[d]);

    resolvedChart.data.labels = days.map(d => `Day ${d}`);
    resolvedChart.data.datasets[0].data = values;
    resolvedChart.update();
}

function populateResolvedMonthDropdown(issues) {
    const selector = document.getElementById("resolvedMonthSelector");
    if (!selector) return;

    selector.innerHTML = "";

    const months = new Set();

    for (const issue of issues) {
        const d = getResolvedDate(issue);
        if (isNaN(d)) continue;
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
    }

    [...months].sort().forEach(key => {
        const [y, m] = key.split("-");
        const label = new Date(y, m).toLocaleString("default", {
            month: "long",
            year: "numeric"
        });

        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = label;
        selector.appendChild(opt);
    });

    if (selector.options.length > 0) {
        selector.selectedIndex = selector.options.length - 1;
    }
}
