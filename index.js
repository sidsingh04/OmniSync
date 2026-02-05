// Main Server File
const express = require("express");
const path = require("path");
const http = require("http");
const setupWebSocket = require("./WS/websocketserver");
const { setupLongPolling } = require("./LONGPOLL/ServerPollHandler");

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "PAGES")));
app.use("/SCRIPTS", express.static(path.join(process.cwd(), "SCRIPTS")));
app.use("/STYLES", express.static(path.join(process.cwd(), "STYLES")));
app.use("/INDEXDB", express.static(path.join(process.cwd(), "INDEXDB")));
app.use("/THEME", express.static(path.join(process.cwd(), "THEME")));
app.use("/RENDERER", express.static(path.join(process.cwd(), "RENDERER")));
app.use("/CHARTS", express.static(path.join(process.cwd(), "CHARTS")));
app.use("/WS", express.static(path.join(process.cwd(), "WS")));
app.use("/STATE", express.static(path.join(process.cwd(), "STATE")));
app.use("/UPLOAD", express.static(path.join(process.cwd(), "UPLOAD")));
app.use("/LONGPOLL", express.static(path.join(process.cwd(), "LONGPOLL")));
app.use("/QUEUE", express.static(path.join(process.cwd(), "QUEUE")));
app.use("/WebWorker", express.static(path.join(process.cwd(), "WebWorker")));

// Explicit route for home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "PAGES", "Login.html"));
});

const server = http.createServer(app);

setupWebSocket(server);

app.use(express.json());

setupLongPolling(app);

server.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});
