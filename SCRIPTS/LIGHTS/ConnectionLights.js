
// Handles the state and display of connection status indicators.

// types of connections supported
const TYPES = {
    WS: 'ws',
    LP: 'lp',
    SP: 'sp',
    SSE: 'sse'
};

// possible states for each connection
const STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ERROR: 'error'
};

// current state of all connections
const connectionState = {
    ws: STATUS.INACTIVE,
    lp: STATUS.INACTIVE,
    sp: STATUS.INACTIVE,
    sse: STATUS.INACTIVE
};


export function initConnectionLights() {
    console.log('[ConnectionLights] init called');
    renderLights();
}


export function updateConnectionStatus(type, status) {

    // check if type is valid
    if (!Object.values(TYPES).includes(type)) {
        console.warn('[ConnectionLights] invalid connection type:', type);
        return;
    }

    // allow boolean status also
    if (typeof status === 'boolean') {
        if (status) {
            status = STATUS.ACTIVE;
        } else {
            status = STATUS.INACTIVE;
        }
    }

    // check if status is valid
    if (!Object.values(STATUS).includes(status)) {
        console.warn('[ConnectionLights] invalid status:', status);
        return;
    }

    // only update if status actually changed
    if (connectionState[type] === status) {
        console.log('[ConnectionLights]', type, 'already', status);
        return;
    }

    console.log('[ConnectionLights] updating', type, 'from', connectionState[type], 'to', status);

    connectionState[type] = status;

    updateLightUI(type, status);
}

// creates all the lights in the DOM
function renderLights() {
    const container = document.getElementById('connection-lights-container');

    if (!container) {
        console.warn('[ConnectionLights] container not found');
        return;
    }

    container.innerHTML = '';

    Object.values(TYPES).forEach(type => {

        const light = document.createElement('div');
        light.id = `light-${type}`;
        light.className = `connection-light ${type} ${connectionState[type]}`;
        light.title = `${type.toUpperCase()} Connection: ${connectionState[type]}`;

        const label = document.createElement('span');
        label.className = 'light-label';
        label.textContent = type.toUpperCase();

        const indicator = document.createElement('span');
        indicator.className = 'light-indicator';

        light.appendChild(label);
        light.appendChild(indicator);

        container.appendChild(light);
    });
}

// updates a single light state
function updateLightUI(type, status) {
    const light = document.getElementById(`light-${type}`);

    if (!light) {
        console.warn('[ConnectionLights] light element not found for', type);
        return;
    }

    console.log('[ConnectionLights] updating UI for', type, '=>', status);


    Object.values(STATUS).forEach(state => {
        light.classList.remove(state);
    });


    light.classList.add(status);
    light.title = `${type.toUpperCase()} Connection: ${status}`;
}
