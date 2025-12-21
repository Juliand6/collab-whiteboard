const express = require("express");
const cors = require("cors");



const app = express();
const authRoutes = require("./routes/auth");

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

const PORT = process.env.PORT || 3001;
app.use("/auth", authRoutes);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const prisma = require("./prismaClient");
const requireAuth = require("./middleware/auth");

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, role: true, subscriptionStatus: true }
  });

  res.json({ user });
});

