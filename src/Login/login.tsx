import { useState, FormEvent, useEffect } from "react";
import classes from "./loginForm.module.css";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../environments/api";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { setIsLoggedIn } = useAuth();
  const [success, setSuccess] = useState<string>("");
  
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/login", JSON.stringify({ email, password }));
      setIsLoggedIn(true);
      setSuccess("Sikeres bejelentkezés!");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    document.title = "Saxon Kitchenware";
  }, []);

  return (
    <div className={classes.logIn}>
      <div className={classes.container}>
        <div className={classes.formWrapper}>
          <h2>Üdvözöljük újra</h2>
          {error && <p className={`${classes.message} ${classes.error}`}>{error}</p>}
          {success && <p className={`${classes.message} ${classes.success}`}>{success}</p>}
          <form onSubmit={handleSubmit}>
            <div className={classes.formGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={classes.formGroup}>
              <label>Jelszó</label>
              <input
                type="password"
                placeholder="*********"
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
    </div>
  );
};

export default LoginForm;
