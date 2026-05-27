export default function Sidebar({ mobileOpen = false, onClose }) {
    return (
        <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>

            <div className="sidebar-logo">
                ♞ Chess Tutor
            </div>

            <nav className="sidebar-menu">
                <a href="/dashboard" onClick={onClose}>Dashboard</a>
                <a href="/games" onClick={onClose}>My Games</a>
                <a href="/analysis" onClick={onClose}>Analysis</a>
                <a href="/coach" onClick={onClose}>Coach</a>
                <a href="/settings" onClick={onClose}>Settings</a>
            </nav>

        </aside>
    );
}
