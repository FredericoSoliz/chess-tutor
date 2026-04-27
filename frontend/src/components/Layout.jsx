import "./layout.css";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";


export default function Layout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />

            <div className="main-section">
                <Navbar />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}