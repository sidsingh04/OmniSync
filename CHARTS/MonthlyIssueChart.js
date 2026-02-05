let chart;
let cachedIssues = [];

function getIssueDate(issue) {
    return new Date(issue.issueDate);
}

export function initMonthlyIssueChart() {
    if (chart) return;

    const canvas = document.getElementById("issuedChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "Tickets issued",
                data: [],
                backgroundColor: "#4f46e5"
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

    const selector = document.getElementById("issueMonthSelector");
    if (selector && !selector.dataset.bound) {
        selector.addEventListener("change", e => {
            renderMonth(e.target.value);
        });
        selector.dataset.bound = "true";
    }
}

export function destroyMonthlyIssueChart() {
    if (chart) {
        chart.destroy();
        chart = null;
    }
}

export function updateMonthlyIssueChart(issues) {
    if (!chart) return;

    cachedIssues = issues;
    populateMonthDropdown(issues);

    const selector = document.getElementById("issueMonthSelector");
    if (!selector || !selector.value) return;

    renderMonth(selector.value);
}

function renderMonth(monthKey) {
    if (!chart) return;

    const dailyCounts = {};

    for (const issue of cachedIssues) {
        const dateObj = getIssueDate(issue);
        if (isNaN(dateObj)) continue;

        const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
        if (key !== monthKey) continue;

        const day = dateObj.getDate();
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    const days = Object.keys(dailyCounts).sort((a, b) => a - b);
    const values = days.map(d => dailyCounts[d]);

    chart.data.labels = days.map(d => `Day ${d}`);
    chart.data.datasets[0].data = values;
    chart.update();
}

function populateMonthDropdown(issues) {
    const selector = document.getElementById("issueMonthSelector");
    if (!selector) return;

    selector.innerHTML = "";

    const months = new Set();

    for (const issue of issues) {
        const d = getIssueDate(issue);
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
