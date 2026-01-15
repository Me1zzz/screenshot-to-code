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


def replace_base64_data_urls(html: str) -> Tuple[str, Dict[str, str]]:
    mapping: Dict[str, str] = {}
    counter = 1

    def _replace(match: re.Match[str]) -> str:
        nonlocal counter
        placeholder = f"__IMG_BASE64_{counter}__"
        counter += 1
        mapping[placeholder] = match.group(0)
        return placeholder

    scrubbed_html = _BASE64_DATA_URL_PATTERN.sub(_replace, html)
    return scrubbed_html, mapping


def restore_base64_placeholders(text: str, mapping: Dict[str, str]) -> str:
    restored = text
    for placeholder, data_url in mapping.items():
        restored = restored.replace(placeholder, data_url)
    return restored
