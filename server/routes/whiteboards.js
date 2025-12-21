const express = require("express");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/auth");

const router = express.Router();


router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { subscriptionStatus: true },
    });

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // limit for free plan
    const FREE_LIMIT = 10;

    if (user.subscriptionStatus === "free") {
      const count = await prisma.whiteboard.count({
        where: { ownerId: req.userId },
      });

      if (count >= FREE_LIMIT) {
        return res.status(403).json({
          error: "Free plan limit reached (10 boards). Upgrade to Pro for unlimited boards.",
          code: "PLAN_LIMIT_REACHED",
          limit: FREE_LIMIT,
        });
      }
    }

    const board = await prisma.whiteboard.create({
      data: {
        title: title || "Untitled",
        content: content ?? {},
        ownerId: req.userId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/", async (req, res) => {
  try {
    const boards = await prisma.whiteboard.findMany({
      where: { ownerId: req.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const board = await prisma.whiteboard.findFirst({
      where: { id, ownerId: req.userId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!board) return res.status(404).json({ error: "Board not found" });

    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    // Ensure ownership
    const existing = await prisma.whiteboard.findFirst({
      where: { id, ownerId: req.userId },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Board not found" });

    const updated = await prisma.whiteboard.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.whiteboard.findFirst({
      where: { id, ownerId: req.userId },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Board not found" });

    await prisma.whiteboard.delete({ where: { id } });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
