import { useState } from "react";
import classes from "./registrationForm.module.css";
import { NavLink } from "react-router-dom";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Regisztráció sikertelen");
      }

      setSuccess("Sikeres regisztráció!");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.formWrapper}>
        <h2>Regisztráció</h2>

        {error && <p className={`${classes.message} ${classes.error}`}>{error}</p>}
        {success && <p className={`${classes.message} ${classes.success}`}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className={classes.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={classes.formGroup}>
            <label>Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={classes.formGroup}>
            <label>Keresztnév</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className={classes.formGroup}>
            <label>Vezetéknév</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className={classes.formGroup}>
            <label>Telefonszám</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <button type="submit" className={classes.button}>Regisztráció</button>
          <p>Már van fiókja?   <NavLink to="/" className={classes.link}>Bejelentkezés</NavLink></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
