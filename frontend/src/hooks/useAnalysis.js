import { useEffect, useRef, useState } from "react";
import { analyzePosition } from "../services/games";

const DEBOUNCE_MS = 200;

export default function useAnalysis(fen, { depth = 15, enabled = true } = {}) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const cacheRef = useRef(new Map());
    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!enabled || !fen) {
            setAnalysis(null);
            return;
        }

        const cached = cacheRef.current.get(fen);
        if (cached) {
            setAnalysis(cached);
            setError("");
            setLoading(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        setLoading(true);
        setError("");

        debounceRef.current = setTimeout(() => {
            const controller = new AbortController();
            abortRef.current = controller;

            analyzePosition(fen, depth, controller.signal)
                .then((data) => {
                    cacheRef.current.set(fen, data);
                    setAnalysis(data);
                })
                .catch((err) => {
                    if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
                    setError("Analysis failed");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [fen, depth, enabled]);

    return { analysis, loading, error };
}
