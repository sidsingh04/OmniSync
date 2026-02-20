//Short polling for checking websocket health repeatedly on failure with exponential backoff
import { updateConnectionStatus } from '../scripts/lights/ConnectionLights.js';

let pollTimer = null;
let controller = null;
let delay = 5000;
let pollingActive = false;

const MAX_DELAY = 60000;

export function startWsHealthPolling({ document, onHealthy }) {
  if (pollingActive) return;

  pollingActive = true;
  updateConnectionStatus('sp', 'active');
  delay = 5000;

  const poll = async () => {
    if (!pollingActive) return;

    if (controller) controller.abort();
    controller = new AbortController();

    try {
      await fetch("http://localhost:3000/health", {
        method: "HEAD",
        signal: controller.signal
      });


      stopWsHealthPolling();
      onHealthy();
      return;

    } catch (err) {
      if (err.name === "AbortError") return;

      delay = Math.min(delay * 2, MAX_DELAY);
    }

    pollTimer = setTimeout(poll, delay);
  };

  pollTimer = setTimeout(poll, delay);
}

export function stopWsHealthPolling() {
  pollingActive = false;
  updateConnectionStatus('sp', 'inactive');

  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  if (controller) {
    controller.abort();
    controller = null;
  }

  delay = 5000;
}