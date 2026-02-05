
/*
  Encapsulates logic for managing long-polling connections and triggers.
 */

// Storage for active polling connections: Map<agentId, res>
const clients = new Map();
const crypto = require('crypto');

function setupLongPolling(app) {
    if (!app) {
        console.error('LongPolling setup failed: Express app instance not provided.');
        return;
    }


    app.get("/api/polling/updates", (req, res) => {
        const { agentId } = req.query;
        console.log(`POLL: Request from ${agentId}`);


        if (!agentId) {
            return res.status(400).json({ error: "Missing agentId" });
        }


        clients.set(agentId, res);


        req.on('close', () => {
            if (clients.get(agentId) === res) {
                clients.delete(agentId);
            }
            
        });

        setTimeout(() => {
            if (clients.get(agentId) === res) {
                res.status(204).end();
                clients.delete(agentId);
            }
        }, 20000);
    });


    app.post("/api/polling/trigger", (req, res) => {
        const { agentId, type, message } = req.body;
        console.log(`POLL: Trigger ${type} for ${agentId}`);
        const eventId = crypto.randomUUID();
        if (!agentId || !type) {
            return res.status(400).json({ error: "Missing agentId or type" });
        }

        if (clients.has(agentId)) {
            const clientRes = clients.get(agentId);
            clientRes.json({ type, message, eventId });
            clients.delete(agentId);
            res.json({ success: true, message: "Event delivered to agent" });
        } else {
            res.status(404).json({ success: false, message: "Agent not connected via polling" });
        }
    });
}

module.exports = { setupLongPolling };
