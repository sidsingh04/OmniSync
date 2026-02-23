//Maintaining an busy agent cache 

// import { getAgentsOfStatus, UpdateAgent, getAgentById } from '../INDEXDB/agentService.js';

export const activeAgentMap = new Map();

export async function initializeActiveAgents() {
    try {
        let activeAgents = await fetch('/api/agent/get-by-status?status=Busy')
            .then(res => res.json())
            .then(data => data.agents);

        activeAgentMap.clear();

        for (const agent of activeAgents) {
            activeAgentMap.set(agent.agentId, agent);
        }

        console.log("Active agent cache initialized:", activeAgentMap);
    } catch (err) {
        console.error("Error initializing active agents:", err);
    }
}

//I want this to not-call db for maintaining cache.
//Wired this with socket-events
export async function updateActiveCache(agentId, agentobj, newStatus) {

    let agent = activeAgentMap.get(agentId);

    if (!agent) {
        agent = agentobj;
    }

    const oldStatus = agent.status;
    agent.status = newStatus;

    if (newStatus === "Busy") {
        activeAgentMap.set(agentId, agent);
    } else {
        activeAgentMap.delete(agentId);
    }

    console.log(`Agent ${agentId} moved from ${oldStatus} → ${newStatus}`);
}
