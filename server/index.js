const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const prisma = require("./prismaClient");
const requireAuth = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const whiteboardRoutes = require("./routes/whiteboards");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

app.use("/auth", authRoutes);
app.use("/whiteboards", whiteboardRoutes);

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, role: true, subscriptionStatus: true },
  });

  res.json({ user });
});

// Socket.IO setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("board:join", ({ boardId }) => {
    console.log("join", socket.id, boardId);
    socket.join(`board:${boardId}`);
  });

  socket.on("stroke:add", ({ boardId, stroke }) => {
    // broadcast to everyone else in the room
    socket.to(`board:${boardId}`).emit("stroke:add", { stroke });
  });

  socket.on("board:clear", ({ boardId }) => {
    socket.to(`board:${boardId}`).emit("board:clear");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
