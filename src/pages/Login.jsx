import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import { supabase } from "../supabase";
import { NavLink } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await supabase.auth.signInWithPassword({ email, password });
    if (response.error) {
      console.error("Error logging in:", response.error.message);
    } else {
      console.log("Logged in successfully");
      navigate("/home");
    }
  };

  return (
    <main className={styles.login}>
      <h1 className={styles.title}>LOG IN</h1>
      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.row}>
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </div>

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.button}>Login</button>
        </div>
      </form>
      <div className={styles.signupLink}>
        <NavLink to="/signup">Do not have an account? Sign up here</NavLink>
      </div>
    </main>
  );
}
