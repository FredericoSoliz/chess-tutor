"""
Provider-agnostic LLM client.

Speaks the OpenAI Chat Completions protocol so it works with:
- LM Studio (local)
- Ollama (local, OpenAI-compatible endpoint)
- Groq (cloud, free tier)
- OpenAI / Anthropic-compatible endpoints

Configuration via environment variables:
    LLM_BASE_URL   default http://host.docker.internal:1234/v1
    LLM_MODEL      default qwen2.5-7b-instruct
    LLM_API_KEY    default lm-studio (LM Studio ignores it but the field is required)
    LLM_TIMEOUT    default 15 (seconds)
"""

import logging
import os
from typing import List, Dict, Optional

import requests

logger = logging.getLogger(__name__)

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://host.docker.internal:1234/v1").rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5-7b-instruct")
LLM_API_KEY = os.getenv("LLM_API_KEY", "lm-studio")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "15"))


def chat(
    messages: List[Dict[str, str]],
    max_tokens: int = 180,
    temperature: float = 0.7,
) -> Optional[str]:
    try:
        response = requests.post(
            f"{LLM_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": LLM_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=LLM_TIMEOUT,
        )

        if response.status_code != 200:
            logger.warning(
                "LLM returned status %d: %s",
                response.status_code,
                response.text[:200],
            )
            return None

        data = response.json()
        text = data["choices"][0]["message"]["content"]
        return text.strip() if text else None

    except requests.exceptions.Timeout:
        logger.warning("LLM call timed out after %.1fs", LLM_TIMEOUT)
        return None
    except Exception as e:
        logger.warning("LLM call failed: %s", e)
        return None
