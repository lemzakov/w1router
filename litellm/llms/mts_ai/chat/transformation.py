"""
MTS AI Chat Transformation

MTS AI provides an OpenAI-compatible API for their KODA LLM.
This transformation reuses the OpenAI-like pattern.

API Base: https://llm.mts.ai/api/v1
"""

from typing import Optional, Tuple

from litellm.llms.base_llm.chat.transformation import BaseLLMException
from litellm.llms.openai.chat.gpt_transformation import OpenAIGPTConfig
from litellm.secret_managers.main import get_secret_str

# Default MTS AI API endpoint
MTS_AI_BASE_URL = "https://llm.mts.ai/api/v1"


class MtsAiError(BaseLLMException):
    """MTS AI API error."""

    pass


class MtsAiConfig(OpenAIGPTConfig):
    """
    Configuration class for MTS AI API.

    MTS AI (KODA) is MTS telecom's LLM service with an OpenAI-compatible API.

    Authentication:
        Set MTS_AI_API_KEY environment variable.

    Model naming:
        Use "mts_ai/KODA" or "mts_ai/KODA-3" etc.
    """

    def _get_openai_compatible_provider_info(
        self,
        api_base: Optional[str],
        api_key: Optional[str],
    ) -> Tuple[Optional[str], Optional[str]]:
        api_base = api_base or get_secret_str("MTS_AI_API_BASE") or MTS_AI_BASE_URL
        dynamic_api_key = api_key or get_secret_str("MTS_AI_API_KEY") or ""
        return api_base, dynamic_api_key
