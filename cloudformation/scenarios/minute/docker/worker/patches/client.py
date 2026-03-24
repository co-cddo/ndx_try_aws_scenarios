"""Patched LLM client with Bedrock support and optional Google/Azure imports."""

from enum import Enum, auto
from typing import TypeVar

from pydantic import BaseModel
from tenacity import (
    retry,
    stop_after_attempt,
    wait_random_exponential,
)

from common.llm.adapters import ModelAdapter, OpenAIModelAdapter
from common.prompts import get_hallucination_detection_messages
from common.settings import get_settings
from common.types import LLMHallucination

# Optional imports — not all providers may be installed
try:
    from google.genai.types import GenerateContentConfig
    from common.llm.adapters import GeminiModelAdapter
except ImportError:
    GenerateContentConfig = None
    GeminiModelAdapter = None

try:
    from common.llm.adapters.bedrock import BedrockModelAdapter
except ImportError:
    BedrockModelAdapter = None

settings = get_settings()
T = TypeVar("T", bound=BaseModel)


class ChatBot:
    def __init__(self, adapter: ModelAdapter) -> None:
        self.adapter = adapter
        self.messages = []

    async def hallucination_check(self) -> list[LLMHallucination]:
        if settings.HALLUCINATION_CHECK:
            return await self.structured_chat(
                messages=get_hallucination_detection_messages(), response_format=list[LLMHallucination]
            )
        return []

    @retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
    async def chat(self, messages: list[dict[str, str]]) -> str:
        response = await self.adapter.chat(messages=self.messages + messages)
        self.messages.extend(messages)
        self.messages.append({"role": "assistant", "content": response})
        return response

    @retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
    async def structured_chat(self, messages: list[dict[str, str]], response_format: type[T]) -> T:
        response = await self.adapter.structured_chat(messages=messages, response_format=response_format)
        self.messages.extend(messages)
        self.messages.append({"role": "assistant", "content": response.model_dump_json()})
        return response


def create_chatbot(model_type: str, model_name: str, temperature: float) -> ChatBot:
    if model_type == "openai":
        return ChatBot(
            OpenAIModelAdapter(
                model=model_name,
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_deployment=settings.AZURE_DEPLOYMENT,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                temperature=temperature,
            )
        )
    elif model_type == "gemini":
        if GeminiModelAdapter is None or GenerateContentConfig is None:
            msg = "Gemini dependencies not installed"
            raise ValueError(msg)
        return ChatBot(
            GeminiModelAdapter(
                model=model_name,
                generate_content_config=GenerateContentConfig(
                    safety_settings=GeminiModelAdapter.no_safety_settings(),
                    temperature=temperature,
                ),
            )
        )
    elif model_type == "bedrock":
        if BedrockModelAdapter is None:
            msg = "BedrockModelAdapter not available"
            raise ValueError(msg)
        return ChatBot(
            BedrockModelAdapter(
                model_id=model_name,
                region_name=settings.AWS_REGION,
                temperature=temperature,
            )
        )
    else:
        msg = f"Unsupported model type: {model_type}"
        raise ValueError(msg)


class FastOrBestLLM(Enum):
    FAST = auto()
    BEST = auto()


def create_default_chatbot(fast_or_best: FastOrBestLLM) -> ChatBot:
    if fast_or_best == FastOrBestLLM.BEST:
        return create_chatbot(settings.BEST_LLM_PROVIDER, settings.BEST_LLM_MODEL_NAME, temperature=0.0)
    else:
        return create_chatbot(settings.FAST_LLM_PROVIDER, settings.FAST_LLM_MODEL_NAME, temperature=0.0)
