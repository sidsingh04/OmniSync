// websocketserver.js
const { WebSocketServer } = require("ws");

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    const supervisors = new Set();
    const agents = new Set();

    function broadcastToAll(payload) {
        const data = JSON.stringify(payload);
        const allClients = [...supervisors, ...agents];
        for (const client of allClients) {
            if (client.readyState === client.OPEN) {
                client.send(data);
            }
        }
    }

    wss.on("connection", (ws) => {
        console.log("[WS] New connection");

        ws.on("message", (raw) => {
            let message;
            try {
                message = JSON.parse(raw);
            } catch {
                console.warn("[WS] Invalid JSON received");
                return;
            }

            // Registration
            if (message.type === "register") {
                if (!["agent", "supervisor"].includes(message.role)) return;

                ws.role = message.role;

                if (ws.role === "agent") agents.add(ws);
                if (ws.role === "supervisor") supervisors.add(ws);

                console.log(`[WS] ${ws.role} registered`);
                return;
            }

            const allowedEvents = [
                "agent:status_updated",
                "issue:created",
                "issue:resolved",
                "issue:rejected",
                "issue:approval",
                "poll:started",
                "poll:stopped"
            ];

            if (allowedEvents.includes(message.type)) {
                broadcastToAll(message);
            }
        });

        ws.on("close", () => {
            agents.delete(ws);
            supervisors.delete(ws);
            console.log("[WS] Connection closed");
        });
    });

    return wss;
}

module.exports = setupWebSocket;
