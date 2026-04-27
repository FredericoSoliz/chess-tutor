export default function Navbar() {

    const logout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    return (
        <header className="navbar">

            <div>
                <h2>Welcome back</h2>
                <p>Ready to improve today?</p>
            </div>

            <button className="logout-btn" onClick={logout}>
                Logout
            </button>

        </header>
    );
}