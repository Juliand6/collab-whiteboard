import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/health`)
      .then((res) => setHealth(res.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Collab Whiteboard</h1>

      {err && <p style={{ color: "red" }}>Error: {err}</p>}

      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Loading health check...</p>
      )}
    </div>
  );
}
