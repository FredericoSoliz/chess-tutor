import api from "./api";

export async function getDashboard(speed = "rapid") {
    const { data } = await api.get("/api/dashboard", { params: { speed } });
    return data;
}
