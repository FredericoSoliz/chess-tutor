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
                <div className="navbar-greeting">
                    <h2>Welcome back</h2>
                    <p>Ready to improve today?</p>
                </div>
            </div>

            <button className="logout-btn" onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
            </button>

        </header>
    );
}
