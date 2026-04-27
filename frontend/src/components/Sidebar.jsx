export default function Sidebar() {
    return (
        <aside className="sidebar">

            <div className="sidebar-logo">
                ♞ Chess Tutor
            </div>

            <nav className="sidebar-menu">
                <a href="/dashboard" className="active">Dashboard</a>
                <a href="/games">My Games</a>
                <a href="/analysis">Analysis</a>
                <a href="/coach">Coach</a>
                <a href="/settings">Settings</a>
            </nav>

        </aside>
    );
}