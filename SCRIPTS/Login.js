import { openDB } from "../INDEXDB/IndexDB.js";
import { agentLogin, supervisorLogin } from "../services/credentials.js";

// Prevent back navigation 
history.pushState(null, null, location.href);
history.pushState(null, null, location.href);
window.addEventListener('popstate', () => {
    history.pushState(null, null, location.href);
});

let currentMode = 'agent';

const slider = document.getElementById('modeSlider');
const agentBtn = document.getElementById('agentBtn');
const supervisorBtn = document.getElementById('supervisorBtn');
const signInBtn = document.getElementById('signInBtn');
const roleText = document.getElementById('roleText');
const userIdInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');

function switchMode(mode) {
    currentMode = mode;

    if (mode === 'agent') {
        slider.className = 'mode-slider agent';
        agentBtn.classList.add('active');
        supervisorBtn.classList.remove('active');
        signInBtn.className = 'sign-in-btn agent';
        roleText.className = 'agent';
        roleText.textContent = 'Agent';
        userIdInput.classList.remove('supervisor-focus');
        passwordInput.classList.remove('supervisor-focus');
    } else {
        slider.className = 'mode-slider supervisor';
        agentBtn.classList.remove('active');
        supervisorBtn.classList.add('active');
        signInBtn.className = 'sign-in-btn supervisor';
        roleText.className = 'supervisor';
        roleText.textContent = 'Supervisor';
        userIdInput.classList.add('supervisor-focus');
        passwordInput.classList.add('supervisor-focus');
    }
}

async function handleSignIn(event) {
    try {
        event.preventDefault();

        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');

        if (errorEl) errorEl.textContent = '';

        // Validation
        if (!userId || userId.trim() === '') {
            if (errorEl) errorEl.textContent = 'Please enter your User ID';
            document.getElementById('userId').focus();
            return;
        }

        if (!password || password.trim() === '') {
            if (errorEl) errorEl.textContent = 'Please enter your password';
            document.getElementById('password').focus();
            return;
        }

        // Create login data object
        const loginData = {
            userId: userId,
            password: password,
            role: currentMode
        };

        console.log('Login attempt:', loginData);

        const db = await openDB();

        if (currentMode === 'agent') {
            try {
                let agent = await agentLogin(userId, password);
                if (!agent) throw new Error("Invalid credentials");
               
                console.log(`Agent ${userId} login Successfully`);
                window.location.replace('./Agent.html');
                sessionStorage.setItem("userId", userId);
                sessionStorage.setItem("Privelege", "agent");

            } catch (err) {
                console.error(err);
                errorEl.textContent = 'Invalid credentials';
            }
        } else {
            try {
                let supervisor = await supervisorLogin(userId, password);
                if (!supervisor) throw new Error("Invalid credentials");

                console.log(`Supervisor ${userId} login Successfully`);
                window.location.replace('./Supervisor.html');
                sessionStorage.setItem("userId", userId);
                sessionStorage.setItem("Privelege", "supervisor");
            } catch (err) {
                console.error(err);
                errorEl.textContent = 'Invalid credentials';
            }

        }
    } catch (err) {
        console.error(err);
    }
}

window.pageActions = {
    "Login": (event) => handleSignIn(event),

    "switch-mode": (event, target) => {
        if (target.id === "agentBtn") {
            switchMode("agent");
        } else if (target.id === "supervisorBtn") {
            switchMode("supervisor");
        }
    }
};