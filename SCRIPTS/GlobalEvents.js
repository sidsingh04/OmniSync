import { initializeTheme } from "../THEME/Theme.js";
import { initDashboard } from "./SUPERVISOR/Supervisor.js";
// import { AgentUI } from "./AGENT/AgentUI.js";


window.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    console.log(`${page} DOM fully loaded`);

    if (page === 'Supervisor') {
        initializeTheme();
        initDashboard();
        document.querySelector(".logo").textContent = sessionStorage.getItem("userId");
    }

    // if (page == 'Agent') {
    //     initializeTheme();
    //     AgentUI.init();
    // }
});

document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-click]");
    if (!target) return;

    const action = target.dataset.click;

    if (window.pageActions?.[action]) {
        window.pageActions[action](event, target);
    } else {
        console.warn("Unhandled click action:", action);
    }
});



document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        console.log("ESC pressed");
    }
});


window.addEventListener("online", () => {
    console.log("Back online");
});

window.addEventListener("offline", () => {
    console.log("Went offline");
});
