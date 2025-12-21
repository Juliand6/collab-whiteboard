import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApi } from "../api";
import { setToken } from "../auth";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");

    try {
      const api = createApi("");
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token);
      nav("/boards");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Login</button>
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>
     <p style={{ marginTop: 10, fontSize: 14 }}>
     No account?{" "}
     <button type="button" onClick={() => nav("/register")}>
         Register
     </button>
     </p>

    </div>
    
  );
}
