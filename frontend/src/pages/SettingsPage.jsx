import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { getProfile, updateProfile, changePassword } from "../services/profile";
import { syncLichessGames } from "../services/games";

import "./settings.css";

const DIFFICULTIES = ["beginner", "easy", "medium", "hard", "master"];

function formatRelative(ms) {
    if (!ms) return "never";
    const diff = Date.now() - ms;
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
    const days = Math.floor(diff / 86_400_000);
    if (days < 30) return `${days} days ago`;
    return new Date(ms).toLocaleDateString("pt-PT");
}

export default function SettingsPage() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [lichess, setLichess] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");

    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [newPwd2, setNewPwd2] = useState("");
    const [pwdMessage, setPwdMessage] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [changingPwd, setChangingPwd] = useState(false);

    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getProfile()
            .then((data) => {
                if (cancelled) return;
                setProfile(data);
                setLichess(data.lichess_username || "");
                setDifficulty(data.default_coach_difficulty || "medium");
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load profile");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    async function saveProfile(e) {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMessage("");
        try {
            const updated = await updateProfile({
                lichess_username: lichess.trim(),
                default_coach_difficulty: difficulty,
            });
            setProfile(updated);
            setProfileMessage("Profile updated");
        } catch (err) {
            setProfileMessage(err.response?.data?.message || "Update failed");
        } finally {
            setSavingProfile(false);
        }
    }

    async function submitPassword(e) {
        e.preventDefault();
        setPwdMessage("");
        setPwdError("");
        if (newPwd.length < 6) {
            setPwdError("New password must be at least 6 characters");
            return;
        }
        if (newPwd !== newPwd2) {
            setPwdError("Passwords don't match");
            return;
        }
        setChangingPwd(true);
        try {
            await changePassword(currentPwd, newPwd);
            setPwdMessage("Password changed");
            setCurrentPwd("");
            setNewPwd("");
            setNewPwd2("");
        } catch (err) {
            setPwdError(err.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPwd(false);
        }
    }

    async function handleResync() {
        setSyncing(true);
        setSyncMessage("");
        try {
            const res = await syncLichessGames();
            setSyncMessage(`Synced — inserted ${res.inserted || 0} new game(s)`);
            const fresh = await getProfile();
            setProfile(fresh);
        } catch (err) {
            setSyncMessage(err.response?.data?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/");
    }

    if (loading) {
        return (
            <Layout>
                <div className="settings-page">
                    <div className="settings-status">Loading…</div>
                </div>
            </Layout>
        );
    }

    if (error || !profile) {
        return (
            <Layout>
                <div className="settings-page">
                    <div className="settings-status error">{error || "Profile not available"}</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="settings-page">
                <section className="settings-card">
                    <h2>Profile</h2>
                    <form onSubmit={saveProfile} className="settings-form">
                        <label className="settings-row">
                            <span className="settings-label">Username</span>
                            <input
                                type="text"
                                value={profile.username}
                                disabled
                                className="settings-input disabled"
                            />
                        </label>

                        <label className="settings-row">
                            <span className="settings-label">Lichess username</span>
                            <input
                                type="text"
                                value={lichess}
                                onChange={(e) => setLichess(e.target.value)}
                                className="settings-input"
                                placeholder="(not linked)"
                            />
                        </label>

                        <label className="settings-row">
                            <span className="settings-label">Default coach difficulty</span>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="settings-input"
                            >
                                {DIFFICULTIES.map((d) => (
                                    <option key={d} value={d}>
                                        {d[0].toUpperCase() + d.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="settings-actions">
                            <button
                                type="submit"
                                className="settings-btn primary"
                                disabled={savingProfile}
                            >
                                {savingProfile ? "Saving…" : "Save changes"}
                            </button>
                            {profileMessage && (
                                <span className="settings-message">{profileMessage}</span>
                            )}
                        </div>
                    </form>
                </section>

                <section className="settings-card">
                    <h2>Change password</h2>
                    <form onSubmit={submitPassword} className="settings-form">
                        <label className="settings-row">
                            <span className="settings-label">Current password</span>
                            <input
                                type="password"
                                value={currentPwd}
                                onChange={(e) => setCurrentPwd(e.target.value)}
                                className="settings-input"
                                required
                            />
                        </label>
                        <label className="settings-row">
                            <span className="settings-label">New password</span>
                            <input
                                type="password"
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.target.value)}
                                className="settings-input"
                                required
                                minLength={6}
                            />
                        </label>
                        <label className="settings-row">
                            <span className="settings-label">Confirm new password</span>
                            <input
                                type="password"
                                value={newPwd2}
                                onChange={(e) => setNewPwd2(e.target.value)}
                                className="settings-input"
                                required
                                minLength={6}
                            />
                        </label>
                        <div className="settings-actions">
                            <button
                                type="submit"
                                className="settings-btn primary"
                                disabled={changingPwd}
                            >
                                {changingPwd ? "Changing…" : "Change password"}
                            </button>
                            {pwdMessage && <span className="settings-message">{pwdMessage}</span>}
                            {pwdError && <span className="settings-message error">{pwdError}</span>}
                        </div>
                    </form>
                </section>

                <section className="settings-card">
                    <h2>Account</h2>
                    <div className="settings-info">
                        <div className="info-row">
                            <span className="info-label">Games synced</span>
                            <span className="info-value">{profile.games_count}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Last sync</span>
                            <span className="info-value">{formatRelative(profile.last_synced_at)}</span>
                        </div>
                    </div>

                    <hr className="settings-divider" />

                    <p className="settings-help">
                        Fetch new games from your Lichess account. Only games played
                        since your last sync are downloaded.
                    </p>
                    <div className="settings-actions">
                        <button
                            type="button"
                            className="settings-btn primary"
                            onClick={handleResync}
                            disabled={syncing || !profile.lichess_username}
                        >
                            {syncing ? "Syncing…" : "Force re-sync now"}
                        </button>
                        {!profile.lichess_username && (
                            <span className="settings-message">
                                Link a Lichess username first.
                            </span>
                        )}
                        {syncMessage && <span className="settings-message">{syncMessage}</span>}
                    </div>
                </section>

                <section className="settings-card">
                    <h2>Session</h2>
                    <p className="settings-help">
                        End your current session and return to the login screen.
                    </p>
                    <div className="settings-actions">
                        <button
                            type="button"
                            className="settings-btn danger"
                            onClick={handleLogout}
                        >
                            Log out
                        </button>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
