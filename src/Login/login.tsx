import { useState, FormEvent } from "react";
import classes from "./loginForm.module.css";
import { NavLink } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Hibás bejelentkezés");
      }

      localStorage.setItem("token", data.token);
      setSuccess("Sikeres bejelentkezés!");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.formWrapper}>
        <h2>Bejelentkezés</h2>
        {error && <p className={`${classes.message} ${classes.error}`}>{error}</p>}
        {success && <p className={`${classes.message} ${classes.success}`}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Jelszó:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Bejelentkezés</button>
          <p>Még nincs fiókja?  <NavLink to="/registration" className={classes.link}>Regisztrácó</NavLink></p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
