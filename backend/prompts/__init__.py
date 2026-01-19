from typing import Union, Any, cast
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionContentPartParam

from custom_types import InputMode
from codegen.utils import replace_base64_data_urls
from image_generation.core import create_alt_url_mapping
from prompts.imported_code_prompts import IMPORTED_CODE_SYSTEM_PROMPTS
from prompts.engineering_update_prompts import ENGINEERING_UPDATE_SYSTEM_PROMPTS
from prompts.screenshot_system_prompts import SYSTEM_PROMPTS
from prompts.text_prompts import SYSTEM_PROMPTS as TEXT_SYSTEM_PROMPTS
from prompts.types import Stack, PromptContent
from video.utils import assemble_claude_prompt_video


USER_PROMPT = """
Generate code for a web page that looks exactly like this.
"""

SVG_USER_PROMPT = """
Generate code for a SVG that looks exactly like this.
"""


async def create_prompt(
    stack: Stack,
    input_mode: InputMode,
    generation_type: str,
    prompt: PromptContent,
    history: list[dict[str, Any]],
    is_imported_from_code: bool,
) -> tuple[list[ChatCompletionMessageParam], dict[str, str], dict[str, str]]:

    image_cache: dict[str, str] = {}
    base64_mapping: dict[str, str] = {}

    if generation_type == "update":
        current_html = history[-2]["text"] if len(history) >= 2 else ""
        update_instruction = history[-1]["text"] if history else ""
        update_images = history[-1].get("images", []) if history else []
        prompt_messages, base64_mapping = assemble_engineering_update_prompt(
            stack=stack,
            input_mode=input_mode,
            prompt=prompt,
            update_instruction=update_instruction,
            update_images=update_images,
            current_html=current_html,
        )
        if current_html:
            image_cache = create_alt_url_mapping(current_html)
    elif is_imported_from_code:
        original_imported_code = history[0]["text"]
        prompt_messages = assemble_imported_code_prompt(original_imported_code, stack)
        for index, item in enumerate(history[1:]):
            role = "user" if index % 2 == 0 else "assistant"
            message = create_message_from_history_item(item, role)
            prompt_messages.append(message)
    else:
        # Assemble the prompt for non-imported code
        if input_mode == "image":
            image_url = prompt["images"][0]
            text_prompt = prompt.get("text", "")
            prompt_messages = assemble_prompt(image_url, stack, text_prompt)
        elif input_mode == "text":
            prompt_messages = assemble_text_prompt(prompt["text"], stack)
        else:
            # Default to image mode for backward compatibility
            image_url = prompt["images"][0]
            text_prompt = prompt.get("text", "")
            prompt_messages = assemble_prompt(image_url, stack, text_prompt)

    if input_mode == "video":
        video_data_url = prompt["images"][0]
        prompt_messages = await assemble_claude_prompt_video(video_data_url)

    return prompt_messages, image_cache, base64_mapping


def create_message_from_history_item(
    item: dict[str, Any], role: str
) -> ChatCompletionMessageParam:
    """
    Create a ChatCompletionMessageParam from a history item.
    Handles both text-only and text+images content.
    """
    # Check if this is a user message with images
    if role == "user" and item.get("images") and len(item["images"]) > 0:
        # Create multipart content for user messages with images
        user_content: list[ChatCompletionContentPartParam] = []

        # Add all images first
        for image_url in item["images"]:
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": image_url, "detail": "high"},
                }
            )

        # Add text content
        user_content.append(
            {
                "type": "text",
                "text": item["text"],
            }
        )

        return cast(
            ChatCompletionMessageParam,
            {
                "role": role,
                "content": user_content,
            },
        )
    else:
        # Regular text-only message
        return cast(
            ChatCompletionMessageParam,
            {
                "role": role,
                "content": item["text"],
            },
        )


def assemble_imported_code_prompt(
    code: str, stack: Stack
) -> list[ChatCompletionMessageParam]:
    system_content = IMPORTED_CODE_SYSTEM_PROMPTS[stack]

    user_content = (
        "Here is the code of the app: " + code
        if stack != "svg"
        else "Here is the code of the SVG: " + code
    )

    return [
        {
            "role": "system",
            "content": system_content + "\n " + user_content,
        }
    ]


def assemble_prompt(
    image_data_url: str,
    stack: Stack,
    text_prompt: str = "",
) -> list[ChatCompletionMessageParam]:
    system_content = SYSTEM_PROMPTS[stack]
    user_prompt = USER_PROMPT if stack != "svg" else SVG_USER_PROMPT

    # Append optional text instructions if provided
    if text_prompt.strip():
        user_prompt = user_prompt.strip() + "\n\nAdditional instructions: " + text_prompt

    user_content: list[ChatCompletionContentPartParam] = [
        {
            "type": "image_url",
            "image_url": {"url": image_data_url, "detail": "high"},
        },
        {
            "type": "text",
            "text": user_prompt,
        },
    ]
    return [
        {
            "role": "system",
            "content": system_content,
        },
        {
            "role": "user",
            "content": user_content,
        },
    ]


def assemble_text_prompt(
    text_prompt: str,
    stack: Stack,
) -> list[ChatCompletionMessageParam]:

    system_content = TEXT_SYSTEM_PROMPTS[stack]

    return [
        {
            "role": "system",
            "content": system_content,
        },
        {
            "role": "user",
            "content": "Generate UI for " + text_prompt,
        },
    ]


def assemble_engineering_update_prompt(
    stack: Stack,
    input_mode: InputMode,
    prompt: PromptContent,
    update_instruction: str,
    update_images: list[str],
    current_html: str,
) -> tuple[list[ChatCompletionMessageParam], dict[str, str]]:
    system_content = ENGINEERING_UPDATE_SYSTEM_PROMPTS[stack]
    prompt_images = prompt.get("images", [])
    image_urls: list[str] = []

    if input_mode != "text":
        if update_images:
            image_urls.extend(update_images)
        elif prompt_images:
            image_urls.extend(prompt_images)

    scrubbed_instruction, mapping = replace_base64_data_urls(update_instruction)
    scrubbed_html, mapping = replace_base64_data_urls(current_html, mapping)

    instruction_block = (
        f"Update instructions:\n{scrubbed_instruction.strip()}\n\n"
        if scrubbed_instruction.strip()
        else ""
    )
    template_label = "SVG" if stack == "svg" else "HTML"

    user_text = (
        f"Update the following {template_label} template using the instructions.\n\n"
        f"{instruction_block}"
        f"Current {template_label}:\n```html\n{scrubbed_html}\n```"
    )

    if image_urls:
        user_content: list[ChatCompletionContentPartParam] = [
            {
                "type": "image_url",
                "image_url": {"url": image_url, "detail": "high"},
            }
            for image_url in image_urls
        ]
        user_content.append(
            {
                "type": "text",
                "text": user_text,
            }
        )
        return (
            [
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_content},
            ],
            mapping,
        )

    return (
        [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_text},
        ],
        mapping,
    )
