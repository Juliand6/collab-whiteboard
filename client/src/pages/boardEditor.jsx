import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Whiteboard from "../components/whiteboard";
import { createApi } from "../api";
import { clearToken, getToken } from "../auth";

export default function BoardEditor() {
  const { id } = useParams();
  const nav = useNavigate();

  const token = getToken();
  const api = useMemo(() => createApi(token), [token]);

  const [title, setTitle] = useState("");
  const [strokes, setStrokes] = useState([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBoard() {
    setErr("");
    try {
      const res = await api.get(`/whiteboards/${id}`);
      setTitle(res.data.title || "Untitled");
      setStrokes(res.data.content?.strokes || []);
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
    else loadBoard();
  }, [id]);

  async function saveBoard() {
    setSaving(true);
    setErr("");
    try {
      await api.put(`/whiteboards/${id}`, {
        title,
        content: { strokes },
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => nav("/boards")}>← Back</button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={saveBoard} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {err && <p style={{ color: "red" }}>{err}</p>}

      <Whiteboard
        initialStrokes={strokes}
        onChange={setStrokes}
      />
    </div>
  );
}
