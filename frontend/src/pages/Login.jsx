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
                    />

                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password *"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "👁" : "◌"}
                        </span>
                    </div>

                    {!isLogin && (
                        <input
                            placeholder="Lichess Username (optional)"
                            value={lichessUsername}
                            onChange={(e) => setLichessUsername(e.target.value)}
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