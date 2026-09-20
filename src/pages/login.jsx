import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../utils/auth";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const role = login(email, password);
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "customer") {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-2xl font-semibold text-titlecolor">Sign in</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-primary/30 bg-secondary px-3 py-2 text-sm text-white"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
