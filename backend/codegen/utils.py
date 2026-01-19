import re
from typing import Dict, Tuple


_BASE64_DATA_URL_PATTERN = re.compile(
    r"data:image/[^;\s]+;base64,[A-Za-z0-9+/=]+"
)


def extract_html_content(text: str):
    # Use regex to find content within <html> tags and include the tags themselves
    match = re.search(r"(<html.*?>.*?</html>)", text, re.DOTALL)
    if match:
        return match.group(1)
    else:
        # Otherwise, we just send the previous HTML over
        print(
            "[HTML Extraction] No <html> tags found in the generated content: " + text
        )
        return text


def replace_base64_data_urls(
    text: str, mapping: Dict[str, str] | None = None
) -> Tuple[str, Dict[str, str]]:
    placeholder_mapping: Dict[str, str] = dict(mapping or {})
    reverse_mapping = {data_url: placeholder for placeholder, data_url in placeholder_mapping.items()}

    def _replace(match: re.Match[str]) -> str:
        data_url = match.group(0)
        existing_placeholder = reverse_mapping.get(data_url)
        if existing_placeholder:
            return existing_placeholder

        placeholder = f"__IMG_BASE64_{len(reverse_mapping) + 1}__"
        reverse_mapping[data_url] = placeholder
        placeholder_mapping[placeholder] = data_url
        return placeholder

    scrubbed_text = _BASE64_DATA_URL_PATTERN.sub(_replace, text)
    return scrubbed_text, placeholder_mapping


def restore_base64_placeholders(text: str, mapping: Dict[str, str]) -> str:
    restored = text
    for placeholder, data_url in mapping.items():
        restored = restored.replace(placeholder, data_url)
    return restored
