"""
Yandex Cloud Foundation Models Provider for LiteLLM

YandexGPT is Yandex's large language model API (Russia).
Supports:
- Chat completions (sync/async)
- Streaming (sync/async)

API Documentation: https://cloud.yandex.ru/docs/foundation-models/
"""

from .chat.transformation import YandexConfig, YandexError

__all__ = [
    "YandexConfig",
    "YandexError",
]
