import copy
import json
from typing import Any, List
from openai.types.chat import ChatCompletionMessageParam


def pprint_prompt(prompt_messages: List[ChatCompletionMessageParam]):
    sanitized_messages = redact_prompt_images(prompt_messages)
    print(json.dumps(sanitized_messages, indent=4, ensure_ascii=False))


def format_prompt_summary(prompt_messages: List[ChatCompletionMessageParam], truncate: bool = True) -> str:
    parts: list[str] = []
    for message in prompt_messages:
        role = message["role"]
        content = message["content"]
        text = ""
        image_count = 0

        if isinstance(content, list):
            for item in content:
                if item["type"] == "text":
                    text += item["text"] + " "
                elif item["type"] == "image_url":
                    image_count += 1
        else:
            text = str(content)

        text = text.strip()
        if truncate and len(text) > 40:
            text = text[:40] + "..."

        img_part = f" + [{image_count} images]" if image_count else ""
        parts.append(f"  {role.upper()}: {text}{img_part}")

    return "\n".join(parts)


def print_prompt_summary(prompt_messages: List[ChatCompletionMessageParam], truncate: bool = True):
    summary = format_prompt_summary(prompt_messages, truncate)
    lines = summary.split('\n')
    
    # Find the maximum line length, with a minimum of 20
    # If truncating, max is 80, otherwise allow up to 120 for full content
    max_allowed = 80 if truncate else 120
    max_length = max(len(line) for line in lines) if lines else 20
    max_length = max(20, min(max_allowed, max_length))
    
    # Ensure title fits
    title = "PROMPT SUMMARY"
    max_length = max(max_length, len(title) + 4)
    
    print("┌─" + "─" * max_length + "─┐")
    title_padding = (max_length - len(title)) // 2
    print(f"│ {' ' * title_padding}{title}{' ' * (max_length - len(title) - title_padding)} │")
    print("├─" + "─" * max_length + "─┤")
    
    for line in lines:
        if len(line) <= max_length:
            print(f"│ {line:<{max_length}} │")
        else:
            # Wrap long lines
            words = line.split()
            current_line = ""
            for word in words:
                if len(current_line + " " + word) <= max_length:
                    current_line += (" " + word) if current_line else word
                else:
                    if current_line:
                        print(f"│ {current_line:<{max_length}} │")
                    current_line = word
            if current_line:
                print(f"│ {current_line:<{max_length}} │")
    
    print("└─" + "─" * max_length + "─┘")
    print()


def redact_prompt_images(data: Any) -> Any:
    cloned_data = copy.deepcopy(data)

    if isinstance(cloned_data, dict):
        for key, value in cloned_data.items():
            if key == "image_url" and isinstance(value, dict):
                url = value.get("url")
                if isinstance(url, str) and url.startswith("data:"):
                    prefix = url.split(",", 1)[0]
                    value["url"] = f"{prefix},<base64-image-placeholder>"
            elif key == "source" and isinstance(value, dict):
                if value.get("type") == "base64" and "data" in value:
                    value["data"] = "<base64-image-placeholder>"
            elif isinstance(value, (dict, list)):
                cloned_data[key] = redact_prompt_images(value)
    elif isinstance(cloned_data, list):
        cloned_data = [redact_prompt_images(item) for item in cloned_data]

    return cloned_data
