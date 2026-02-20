//Maintaining an busy agent cache 

import { getAgentsOfStatus, UpdateAgent, getAgentById } from '../INDEXDB/agentService.js';

export const activeAgentMap = new Map();

export async function initializeActiveAgents(db) {
    const activeAgents = await getAgentsOfStatus(db, "Busy");

    activeAgentMap.clear();

    for (const agent of activeAgents) {
        activeAgentMap.set(agent.agentId, agent);
    }

    console.log("Active agent cache initialized:", activeAgentMap);
}

//I want this to not-call db for maintaining cache.
//Wired this with socket-events
export async function updateActiveCache(agentId,agentobj, newStatus) {

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
