export default function Navbar({ onMenuClick }) {

    const logout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    return (
        <header className="navbar">

            <div className="navbar-left">
                {onMenuClick && (
                    <button
                        className="navbar-hamburger"
                        onClick={onMenuClick}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>
                )}
                <div>
                    <h2>Welcome back</h2>
                    <p>Ready to improve today?</p>
                </div>
            </div>

            <button className="logout-btn" onClick={logout}>
                Logout
            </button>

        </header>
    );
}
