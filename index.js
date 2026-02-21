// Main Server File
const express = require("express");
const path = require("path");
const http = require("http");
const setupWebSocket = require("./WS/websocketserver");
const { setupLongPolling } = require("./longpoll/ServerPollHandler");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "pages")));
app.use("/scripts", express.static(path.join(process.cwd(), "scripts")));
app.use("/styles", express.static(path.join(process.cwd(), "styles")));
app.use("/INDEXDB", express.static(path.join(process.cwd(), "INDEXDB")));
app.use("/theme", express.static(path.join(process.cwd(), "theme")));
app.use("/renderer", express.static(path.join(process.cwd(), "renderer")));
app.use("/charts", express.static(path.join(process.cwd(), "charts")));
app.use("/WS", express.static(path.join(process.cwd(), "WS")));
app.use("/state", express.static(path.join(process.cwd(), "state")));
app.use("/UPLOAD", express.static(path.join(process.cwd(), "UPLOAD")));
app.use("/longpoll", express.static(path.join(process.cwd(), "longpoll")));
app.use("/queue", express.static(path.join(process.cwd(), "queue")));
app.use("/WebWorker", express.static(path.join(process.cwd(), "WebWorker")));
app.use("/models", express.static(path.join(process.cwd(), "models")));
app.use("/services", express.static(path.join(process.cwd(), "services")));

// Explicit route for home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "Login.html"));
});

const server = http.createServer(app);

setupWebSocket(server);

app.use(express.json());
app.use(cors());

// Login API routes
app.post("/api/login/agent", async (req, res) => {
  try {
    const { agentId, password } = req.body;
    const { agentCredentials } = require("./models/Credentials");
    const agent = await agentCredentials.findOne({ agentId, password });
    if (agent) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Agent login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/login/supervisor", async (req, res) => {
  try {
    const { superId, password } = req.body;
    const { superCredentials } = require("./models/Credentials");
    const supervisor = await superCredentials.findOne({ superId, password });
    if (supervisor) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Supervisor login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

setupLongPolling(app);

server.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});
