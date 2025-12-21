import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApi } from "../api";
import { clearToken, getToken } from "../auth";

export default function Boards() {
  const nav = useNavigate();
  const token = getToken();
  const api = createApi(token);

  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("Untitled");
  const [err, setErr] = useState("");

  async function loadBoards() {
    setErr("");
    try {
      const res = await api.get("/whiteboards");
      setBoards(res.data.boards);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
      if (e?.response?.status === 401) {
        clearToken();
        nav("/login");
      }
    }
  }

  useEffect(() => {
    if (!token) nav("/login");
    else loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createBoard() {
    setErr("");
    try {
      const res = await api.post("/whiteboards", {
        title,
        content: { strokes: [] },
      });
      nav(`/board/${res.data.id}`);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setErr(msg);

      // plan limit hit
      if (e?.response?.data?.code === "PLAN_LIMIT_REACHED") {
        // later: show Upgrade modal
      }
    }
  }

  async function delBoard(id) {
    if (!confirm("Delete this board?")) return;
    await api.delete(`/whiteboards/${id}`);
    loadBoards();
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <h2 style={{ marginRight: 10 }}>My Boards</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <button onClick={createBoard}>New board</button>
        <button
          onClick={() => {
            clearToken();
            nav("/login");
          }}
          style={{ marginLeft: "auto" }}
        >
          Logout
        </button>
      </div>

      {err && <p style={{ color: "red" }}>{err}</p>}

      <ul style={{ marginTop: 16 }}>
        {boards.map((b) => (
          <li key={b.id} style={{ marginBottom: 8 }}>
            <button onClick={() => nav(`/board/${b.id}`)}>{b.title}</button>
            <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>
              updated {new Date(b.updatedAt).toLocaleString()}
            </span>
            <button style={{ marginLeft: 10 }} onClick={() => delBoard(b.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
