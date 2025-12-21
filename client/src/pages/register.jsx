import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApi } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");

    try {
      const api = createApi("");
      await api.post("/auth/register", { name, email, password, role });
      // After registering, send them to login
      nav("/login");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Register</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="teacher">teacher</option>
            <option value="student">student</option>
          </select>
        </label>

        <button type="submit">Create account</button>
        {err && <p style={{ color: "red" }}>{err}</p>}
      </form>

      <p style={{ marginTop: 10, fontSize: 14 }}>
        Already have an account?{" "}
        <button type="button" onClick={() => nav("/login")}>
          Login
        </button>
      </p>
    </div>
  );
}
