import logging
import os
from typing import List, Dict, Optional

import requests

logger = logging.getLogger(__name__)

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://host.docker.internal:1234/v1").rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5-7b-instruct")
LLM_API_KEY = os.getenv("LLM_API_KEY", "lm-studio")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "15"))
LLM_PROXY = os.getenv("LLM_PROXY")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_TIMEOUT = float(os.getenv("GROQ_TIMEOUT", "10"))


def _call(base_url, model, api_key, messages, max_tokens, temperature, timeout, proxy):
    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=timeout,
            proxies={"http": proxy, "https": proxy} if proxy else None,
        )

        if response.status_code != 200:
            logger.warning("LLM %s status %d: %s", base_url, response.status_code, response.text[:200])
            return None

        data = response.json()
        text = data["choices"][0]["message"]["content"]
        return text.strip() if text else None

    except requests.exceptions.Timeout:
        logger.warning("LLM %s timed out after %.1fs", base_url, timeout)
        return None
    except Exception as e:
        logger.warning("LLM %s failed: %s", base_url, e)
        return None


def chat(
    messages: List[Dict[str, str]],
    max_tokens: int = 180,
    temperature: float = 0.7,
) -> Optional[str]:
    if GROQ_API_KEY:
        result = _call(
            GROQ_BASE_URL, GROQ_MODEL, GROQ_API_KEY,
            messages, max_tokens, temperature,
            GROQ_TIMEOUT, None,
        )
        if result is not None:
            return result
        logger.info("Groq failed, falling back to local LLM")

    result = _call(
        LLM_BASE_URL, LLM_MODEL, LLM_API_KEY,
        messages, max_tokens, temperature,
        LLM_TIMEOUT, LLM_PROXY,
    )
    if result is not None:
        return result

    return None
