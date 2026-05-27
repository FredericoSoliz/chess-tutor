import { useState } from "react";
import "./layout.css";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";


export default function Layout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            {mobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className="main-section">
                <Navbar onMenuClick={() => setMobileOpen(true)} />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
