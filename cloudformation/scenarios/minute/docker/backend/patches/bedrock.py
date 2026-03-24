"""Bedrock Model Adapter for AWS Bedrock Runtime (Converse API)."""

import json
import logging
from typing import TypeVar

import boto3
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class BedrockModelAdapter:
    """ModelAdapter implementation using AWS Bedrock Runtime Converse API."""

    def __init__(self, model_id: str, region_name: str | None = None, temperature: float = 0.0, **kwargs) -> None:
        self._model_id = model_id
        self._temperature = temperature
        self._client = boto3.client("bedrock-runtime", region_name=region_name)
        self._kwargs = kwargs

    def _convert_messages(self, messages: list[dict[str, str]]) -> tuple[list[dict], str | None]:
        """Convert OpenAI-format messages to Bedrock Converse format."""
        converse_messages = []
        system_prompt = None

        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if role == "system":
                system_prompt = content
            elif role == "user":
                converse_messages.append({
                    "role": "user",
                    "content": [{"text": content}],
                })
            elif role == "assistant":
                converse_messages.append({
                    "role": "assistant",
                    "content": [{"text": content}],
                })

        return converse_messages, system_prompt

    async def chat(self, messages: list[dict[str, str]]) -> str:
        """Send a chat message and return the text response."""
        converse_messages, system_prompt = self._convert_messages(messages)

        kwargs = {
            "modelId": self._model_id,
            "messages": converse_messages,
            "inferenceConfig": {
                "temperature": self._temperature,
                "maxTokens": 8192,
            },
        }

        if system_prompt:
            kwargs["system"] = [{"text": system_prompt}]

        response = self._client.converse(**kwargs)

        content = response["output"]["message"]["content"]
        for block in content:
            if "text" in block:
                return block["text"]

        return ""

    async def structured_chat(self, messages: list[dict[str, str]], response_format: type[T]) -> T:
        """Send a chat message and return a structured response matching the Pydantic model."""
        converse_messages, system_prompt = self._convert_messages(messages)

        # Use tool use to force structured output
        json_schema = response_format.model_json_schema()

        tool_config = {
            "tools": [
                {
                    "toolSpec": {
                        "name": "structured_output",
                        "description": f"Output data matching the {response_format.__name__} schema",
                        "inputSchema": {"json": json_schema},
                    }
                }
            ],
            "toolChoice": {"tool": {"name": "structured_output"}},
        }

        kwargs = {
            "modelId": self._model_id,
            "messages": converse_messages,
            "toolConfig": tool_config,
            "inferenceConfig": {
                "temperature": self._temperature,
                "maxTokens": 8192,
            },
        }

        if system_prompt:
            kwargs["system"] = [{"text": system_prompt}]

        response = self._client.converse(**kwargs)

        content = response["output"]["message"]["content"]
        for block in content:
            if "toolUse" in block:
                tool_input = block["toolUse"]["input"]
                if isinstance(tool_input, str):
                    return response_format.model_validate_json(tool_input)
                else:
                    return response_format.model_validate(tool_input)

        # Fallback: try to parse text response as JSON
        for block in content:
            if "text" in block:
                return response_format.model_validate_json(block["text"])

        msg = "No structured output found in Bedrock response"
        raise ValueError(msg)
