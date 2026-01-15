from typing import Any, Literal

from openai.types.chat import ChatCompletionContentPartParam, ChatCompletionMessageParam

from custom_types import InputMode
from prompts.types import PromptContent, Stack


def _resolve_instruction_text(
    generation_type: Literal["create", "update"],
    prompt: PromptContent,
    history: list[dict[str, Any]],
) -> str:
    if generation_type == "update" and history:
        return str(history[-1].get("text", "")).strip()
    return str(prompt.get("text", "")).strip()


def _resolve_reference_image(
    input_mode: InputMode,
    generation_type: Literal["create", "update"],
    prompt: PromptContent,
    history: list[dict[str, Any]],
) -> str | None:
    if input_mode == "text":
        return None

    if generation_type == "update" and history:
        last_images = history[-1].get("images") or []
        if last_images:
            return str(last_images[0])

    images = prompt.get("images", [])
    if images:
        return str(images[0])
    return None


def assemble_engineering_refinement_prompt(
    stack: Stack,
    input_mode: InputMode,
    generation_type: Literal["create", "update"],
    prompt: PromptContent,
    history: list[dict[str, Any]],
    engineered_html: str,
) -> list[ChatCompletionMessageParam]:
    instruction = _resolve_instruction_text(generation_type, prompt, history)
    instruction_block = (
        f"\n\nAdditional instructions: {instruction}" if instruction else ""
    )

    user_text = (
        "You are given an initial HTML implementation from the engineering variant. "
        "Refine it to match the reference (if provided) with higher visual fidelity. "
        "Return only the full updated HTML."
        f"{instruction_block}\n\nCurrent HTML:\n```html\n{engineered_html}\n```"
    )

    image_url = _resolve_reference_image(input_mode, generation_type, prompt, history)
    if image_url:
        content_parts: list[ChatCompletionContentPartParam] = [
            {
                "type": "image_url",
                "image_url": {"url": image_url, "detail": "high"},
            },
            {
                "type": "text",
                "text": user_text,
            },
        ]
        user_content: ChatCompletionMessageParam = {
            "role": "user",
            "content": content_parts,
        }
    else:
        user_content = {
            "role": "user",
            "content": user_text,
        }

    return [user_content]
