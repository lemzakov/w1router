"""
Yandex Cloud Foundation Models Chat Transformation

Transforms OpenAI-format requests to YandexGPT format and back.

API docs: https://cloud.yandex.ru/docs/foundation-models/api-ref/TextGeneration/completion
"""

from typing import TYPE_CHECKING, Any, List, Optional, Union

import httpx

from litellm._logging import verbose_logger
from litellm.llms.base_llm.chat.transformation import BaseConfig, BaseLLMException
from litellm.secret_managers.main import get_secret_str
from litellm.types.llms.openai import AllMessageValues
from litellm.types.utils import Choices, Message, ModelResponse, Usage

if TYPE_CHECKING:
    from litellm.litellm_core_utils.litellm_logging import Logging as _LiteLLMLoggingObj

    LiteLLMLoggingObj = _LiteLLMLoggingObj
else:
    LiteLLMLoggingObj = Any

# Yandex Foundation Models API endpoint
YANDEX_BASE_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1"


class YandexError(BaseLLMException):
    """Yandex Foundation Models API error."""

    pass


class YandexConfig(BaseConfig):
    """
    Configuration class for Yandex Cloud Foundation Models API.

    YandexGPT is Yandex's LLM available through Yandex Cloud.

    Supported parameters:
        temperature: Sampling temperature (0-1, default 0.6)
        max_tokens: Maximum tokens to generate
        stream: Whether to stream responses

    Authentication:
        Set YANDEX_API_KEY (IAM token or API key) and YANDEX_FOLDER_ID
        (Yandex Cloud folder ID where the model is deployed).

    Model naming:
        Use "yandexgpt/yandexgpt-lite" or "yandexgpt/yandexgpt" etc.
        Full URI: gpt://{folder_id}/yandexgpt-lite/latest
    """

    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

    def __init__(
        self,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> None:
        locals_ = locals()
        for key, value in locals_.items():
            if key != "self" and value is not None:
                setattr(self.__class__, key, value)
        BaseConfig.__init__(self)

    @classmethod
    def get_config(cls):
        return {
            k: v
            for k, v in cls.__dict__.items()
            if not k.startswith("__")
            and not callable(v)
            and k not in ("model_fields", "__fields__")
            and v is not None
        }

    def get_supported_openai_params(self, model: str) -> List[str]:
        return [
            "temperature",
            "max_tokens",
            "max_completion_tokens",
            "stream",
        ]

    def map_openai_params(
        self,
        non_default_params: dict,
        optional_params: dict,
        model: str,
        drop_params: bool,
    ) -> dict:
        for param, value in non_default_params.items():
            if param == "temperature":
                optional_params["temperature"] = value
            elif param in ("max_tokens", "max_completion_tokens"):
                optional_params["maxTokens"] = value
            elif param == "stream":
                optional_params["stream"] = value
        return optional_params

    def _get_folder_id(self, api_base: Optional[str] = None) -> str:
        """Get Yandex Cloud folder ID."""
        folder_id = get_secret_str("YANDEX_FOLDER_ID") or ""
        if not folder_id:
            raise YandexError(
                status_code=401,
                message="YANDEX_FOLDER_ID not set. Please set the YANDEX_FOLDER_ID environment variable.",
            )
        return folder_id

    def _get_model_uri(self, model: str, folder_id: str) -> str:
        """
        Convert model name to Yandex model URI.

        Input model can be:
        - "yandexgpt-lite" or "yandexgpt/yandexgpt-lite" -> gpt://{folder_id}/yandexgpt-lite/latest
        - Full URI already (gpt://...) -> returned as-is
        """
        if model.startswith("gpt://") or model.startswith("ds://"):
            return model
        # Strip provider prefix if present
        model_name = model.split("/")[-1] if "/" in model else model
        # Remove version suffix if present, or append latest
        if ":" in model_name:
            model_name, version = model_name.rsplit(":", 1)
        else:
            version = "latest"
        return f"gpt://{folder_id}/{model_name}/{version}"

    def validate_environment(
        self,
        headers: dict,
        model: str,
        messages: List[AllMessageValues],
        optional_params: dict,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
    ) -> dict:
        api_key = (
            api_key
            or get_secret_str("YANDEX_API_KEY")
            or get_secret_str("YANDEX_IAM_TOKEN")
        )
        if not api_key:
            raise YandexError(
                status_code=401,
                message="Yandex API key not found. Set YANDEX_API_KEY or YANDEX_IAM_TOKEN.",
            )

        # Determine auth header type
        if api_key.startswith("t1.") or len(api_key) > 100:
            # Looks like IAM token
            auth_header = f"Bearer {api_key}"
        else:
            # API key
            auth_header = f"Api-Key {api_key}"

        headers.update(
            {
                "Authorization": auth_header,
                "Content-Type": "application/json",
                "x-folder-id": get_secret_str("YANDEX_FOLDER_ID") or "",
            }
        )
        return headers

    def get_complete_url(
        self,
        api_base: Optional[str],
        api_key: Optional[str],
        model: str,
        optional_params: dict,
        stream: Optional[bool] = None,
    ) -> str:
        base = api_base or get_secret_str("YANDEX_API_BASE") or YANDEX_BASE_URL
        base = base.rstrip("/")
        if stream:
            return f"{base}/completionStream"
        return f"{base}/completion"

    def transform_request(
        self,
        model: str,
        messages: List[AllMessageValues],
        optional_params: dict,
        litellm_params: dict,
        headers: dict,
    ) -> dict:
        folder_id = get_secret_str("YANDEX_FOLDER_ID") or ""
        model_uri = self._get_model_uri(model, folder_id)

        yandex_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if isinstance(content, list):
                text_parts = [p.get("text", "") for p in content if p.get("type") == "text"]
                content = " ".join(text_parts)
            yandex_messages.append({"role": role, "text": str(content)})

        completion_options: dict = {}
        if "temperature" in optional_params:
            completion_options["temperature"] = optional_params["temperature"]
        if "maxTokens" in optional_params:
            completion_options["maxTokens"] = str(optional_params["maxTokens"])
        if "stream" in optional_params:
            completion_options["stream"] = optional_params["stream"]

        return {
            "modelUri": model_uri,
            "completionOptions": completion_options,
            "messages": yandex_messages,
        }

    def transform_response(
        self,
        model: str,
        raw_response: httpx.Response,
        model_response: ModelResponse,
        logging_obj: LiteLLMLoggingObj,
        request_data: dict,
        messages: List[AllMessageValues],
        optional_params: dict,
        litellm_params: dict,
        encoding: Any,
        api_key: Optional[str] = None,
        json_mode: Optional[bool] = None,
    ) -> ModelResponse:
        try:
            response_json = raw_response.json()
        except Exception:
            raise YandexError(
                status_code=raw_response.status_code,
                message=f"Failed to parse Yandex response: {raw_response.text}",
            )

        if raw_response.status_code != 200:
            raise YandexError(
                status_code=raw_response.status_code,
                message=response_json.get("message", str(response_json)),
            )

        # Yandex response format:
        # { "result": { "alternatives": [{"message": {"role": "...", "text": "..."}, "status": "..."}],
        #               "usage": {"inputTextTokens": "...", "completionTokens": "...", "totalTokens": "..."},
        #               "modelVersion": "..." } }
        result = response_json.get("result", response_json)
        alternatives = result.get("alternatives", [])

        if not alternatives:
            raise YandexError(
                status_code=500,
                message=f"No alternatives in Yandex response: {response_json}",
            )

        choice = alternatives[0]
        message_data = choice.get("message", {})
        text = message_data.get("text", "")

        finish_reason = (
            choice.get("status", "stop")
            .replace("ALTERNATIVE_STATUS_FINAL", "stop")
            .lower()
        )

        model_response.choices = [
            Choices(
                finish_reason=finish_reason,
                index=0,
                message=Message(
                    content=text,
                    role=message_data.get("role", "assistant"),
                ),
            )
        ]

        usage_data = result.get("usage", {})
        model_response.usage = Usage(
            prompt_tokens=int(usage_data.get("inputTextTokens", 0)),
            completion_tokens=int(usage_data.get("completionTokens", 0)),
            total_tokens=int(usage_data.get("totalTokens", 0)),
        )

        model_response.model = f"yandexgpt/{model}"
        return model_response

    def get_error_class(
        self, error_message: str, status_code: int, headers: Union[dict, httpx.Headers]
    ) -> BaseLLMException:
        return YandexError(status_code=status_code, message=error_message)
