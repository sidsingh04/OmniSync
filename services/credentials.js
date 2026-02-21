// Login for agent and supervisor using backend API endpoints

// agent login
export async function agentLogin(agentId, password) {
    try {
        const response = await fetch('/api/login/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, password })
        });
        if (response.ok) {
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error("Agent login error:", error);
    }
    return false;
}

// supervisor login
export async function supervisorLogin(superId, password) {
    try {
        const response = await fetch('/api/login/supervisor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ superId, password })
        });
        if (response.ok) {
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error("Supervisor login error:", error);
    }
    return false;
}