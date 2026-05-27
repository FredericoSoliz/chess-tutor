import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../services/api";
import "./login.css";
import heroImage from "../assets/chess-hero.jpg";

export default function Login() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [lichessUsername, setLichessUsername] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    if (localStorage.getItem("token")) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async () => {

        if (!username.trim()) {
            alert("Username is required");
            return;
        }

        if (!password.trim()) {
            alert("Password is required");
            return;
        }

        try {
            const url = isLogin ? "/auth/login" : "/auth/register";

            const payload = {
                username,
                password,
            };

            if (!isLogin) {
                payload.lichess_username = lichessUsername;
            }

            const res = await api.post(url, payload);

            if (isLogin) {
                localStorage.setItem("token", res.data.token);
                navigate("/dashboard");
            } else {
                setIsLogin(true);
                setUsername("");
                setPassword("");
                setLichessUsername("");
            }

        } catch (error) {
            console.log(error);
            console.log(error.response);
            alert(error.response?.data?.message || "Error");
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setUsername("");
        setPassword("");
        setLichessUsername("");
    };

    return (
        <div className="auth-container">

            <div
                className="left"
                style={{
                    backgroundImage: `linear-gradient(
                        rgba(35, 25, 15, 0.55),
                        rgba(35, 25, 15, 0.65)
                    ), url(${heroImage})`
                }}
            >
                <h1 className="brand">♞ Intelligent Chess Tutor</h1>

                <p className="subtitle">
                    Learn chess with engine analysis, AI coaching and real progress tracking.
                </p>

                <p className="quote">
                    “Every move shapes the future.”
                </p>
            </div>

            <div className="right">
                <div className="form-box">
                    <h2>{isLogin ? "Sign In" : "Register"}</h2>

                    <input
                        placeholder="Username *"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                    />

                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password *"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                        />

                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                    <line x1="2" y1="2" x2="22" y2="22" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </span>
                    </div>

                    {!isLogin && (
                        <input
                            placeholder="Lichess Username (optional)"
                            value={lichessUsername}
                            onChange={(e) => setLichessUsername(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    )}

                    <button onClick={handleSubmit}>
                        {isLogin ? "Sign In" : "Register"}
                    </button>

                    <p className="switch" onClick={switchMode}>
                        {isLogin
                            ? "Don't have an account? Register"
                            : "Already have an account? Sign in"}
                    </p>
                </div>
            </div>

        </div>
    );
}