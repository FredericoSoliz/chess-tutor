import api from "./api";

export async function getProfile() {
    const { data } = await api.get("/api/profile");
    return data;
}

export async function updateProfile(updates) {
    const { data } = await api.patch("/api/profile", updates);
    return data;
}

export async function changePassword(currentPassword, newPassword) {
    const { data } = await api.post("/api/profile/password", {
        current_password: currentPassword,
        new_password: newPassword,
    });
    return data;
}
