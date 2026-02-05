/*
  Handles searching and selecting agents
 */

import { openDB } from '../INDEXDB/IndexDB.js';
import { getAllAgents } from '../INDEXDB/agentService.js';
import { showToast } from './Utils.js';

let allAgents = [];
let agentSearchTimeout = null;

export function initAgentSearch(inputElement, resultsContainer, hiddenIdInput, onSelect = null) {
    if (!inputElement || !resultsContainer) return;

    inputElement.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        if (searchTerm.length > 0) {
            clearTimeout(agentSearchTimeout);
            agentSearchTimeout = setTimeout(() => {
                searchAgents(searchTerm, resultsContainer, hiddenIdInput, inputElement, onSelect);
            }, 300);
        } else {
            hideAgentSearchResults(resultsContainer);
            clearSelectedAgent(hiddenIdInput);
        }
    });

    inputElement.addEventListener('focus', () => {
        if (inputElement.value.trim().length > 0) {
            searchAgents(inputElement.value.trim(), resultsContainer, hiddenIdInput, inputElement, onSelect);
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        const searchWrapper = inputElement.closest('.agent-search-wrapper');
       
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            hideAgentSearchResults(resultsContainer);
        } else if (!searchWrapper && e.target !== inputElement && e.target !== resultsContainer) {
           
            hideAgentSearchResults(resultsContainer);
        }
    });

    loadAgentsForSearch();
}


export async function loadAgentsForSearch() {
    try {
        const db = await openDB();
        allAgents = await getAllAgents(db);
        console.log('Agents loaded for search:', allAgents);
        return allAgents;
    } catch (error) {
        console.error('Error loading agents:', error);
        showToast('error', 'Error', 'Failed to load agents. Please try again.');
        return [];
    }
}


export function filterAgents(agents, searchTerm) {
    if (!agents || agents.length === 0) return [];
    if (!searchTerm) return agents;

    const searchLower = searchTerm.toLowerCase();

    return agents.filter(agent => {
        const agentId = String(agent.agentId || '').toLowerCase();
        const agentName = String(agent.name || '').toLowerCase();
        // Also search department and status if they exist (for AgentsTab)
        const department = String(agent.department || '').toLowerCase();
        const status = String(agent.status || '').toLowerCase();

        return agentId.includes(searchLower) ||
            agentName.includes(searchLower) ||
            department.includes(searchLower) ||
            status.includes(searchLower);
    });
}


function searchAgents(searchTerm, resultsContainer, hiddenIdInput, inputElement, onSelect) {
    const searchLower = searchTerm.toLowerCase();

    if (!resultsContainer || allAgents.length === 0) {
        hideAgentSearchResults(resultsContainer);
        return;
    }

    // Filter agents by agentId or name
    const filteredAgents = filterAgents(allAgents, searchLower);

    if (filteredAgents.length === 0) {
        resultsContainer.innerHTML = '<div class="agent-search-item no-results">No agents found</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    resultsContainer.innerHTML = filteredAgents.map(agent => `
        <div class="agent-search-item" data-agent-id="${agent.agentId}">
            <span class="agent-id">${agent.agentId}</span>
            <span class="agent-name">${agent.name || 'N/A'}</span>
        </div>
    `).join('');

    resultsContainer.style.display = 'block';

    // Add click handlers to search results
    resultsContainer.querySelectorAll('.agent-search-item').forEach(item => {
        if (!item.classList.contains('no-results')) {
            item.addEventListener('click', () => {
                selectAgent(item.dataset.agentId, inputElement, hiddenIdInput, resultsContainer, onSelect);
            });
        }
    });
}


function selectAgent(agentId, inputElement, hiddenIdInput, resultsContainer, onSelect) {
    const agent = allAgents.find(a => a.agentId === agentId);
    if (!agent) return;

    if (inputElement && hiddenIdInput) {
        inputElement.value = `${agent.agentId} - ${agent.name || 'N/A'}`;
        hiddenIdInput.value = agentId;
        hideAgentSearchResults(resultsContainer);

        if (onSelect) {
            onSelect(agent);
        }
    }
}


export function clearSelectedAgent(hiddenIdInput) {
    if (hiddenIdInput) {
        hiddenIdInput.value = '';
    }
}


export function clearAgentSearch(inputElement, resultsContainer, hiddenIdInput) {
    if (inputElement) inputElement.value = '';
    hideAgentSearchResults(resultsContainer);
    clearSelectedAgent(hiddenIdInput);
}

export function hideAgentSearchResults(resultsContainer) {
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}
