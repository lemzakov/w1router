"""
MTS AI LLM Provider for LiteLLM

MTS AI (KODA) is MTS's (Russia's major telecom) LLM API.
The API is OpenAI-compatible.

API Documentation: https://api.mts-ai.ru/docs
"""

from .chat.transformation import MtsAiConfig, MtsAiError

__all__ = [
    "MtsAiConfig",
    "MtsAiError",
]
