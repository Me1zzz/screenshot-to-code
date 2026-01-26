from __future__ import annotations

import logging
import tomllib
import re
from dataclasses import dataclass
from typing import Any, Awaitable, Callable


logger = logging.getLogger(__name__)


class BlockUpdateError(ValueError):
    pass


def _find_whitespace_insensitive_span(text: str, snippet: str) -> tuple[int, int]:
    text_stripped = []
    text_index_map = []
    for index, char in enumerate(text):
        if not char.isspace():
            text_stripped.append(char)
            text_index_map.append(index)

    snippet_stripped = "".join(char for char in snippet if not char.isspace())
    if not snippet_stripped:
        raise BlockUpdateError("Original snippet is empty after whitespace stripping.")

    stripped_text = "".join(text_stripped)
    start_stripped = stripped_text.find(snippet_stripped)
    if start_stripped == -1:
        raise BlockUpdateError(
            "Original snippet not found for replacement (whitespace-insensitive)."
        )

    end_stripped = start_stripped + len(snippet_stripped) - 1
    start_index = text_index_map[start_stripped]
    end_index = text_index_map[end_stripped] + 1
    return start_index, end_index


def replace_first_occurrence(html: str, old: str, new: str) -> tuple[str, int]:
    start_index = html.find(old)
    if start_index == -1:
        start_index, end_index = _find_whitespace_insensitive_span(html, old)
        updated_html = html[:start_index] + new + html[end_index:]
        end_index = start_index + len(new)
        return updated_html, end_index
    updated_html = html[:start_index] + new + html[start_index + len(old) :]
    end_index = start_index + len(new)
    return updated_html, end_index


def replace_tag_by_data_cid(
    html: str, data_cid: str, new_html: str
) -> tuple[str, int]:
    pattern = re.compile(
        r"<(?P<tag>[a-zA-Z][\w:-]*)\b[^>]*\bdata-cid=(\"|')"
        + re.escape(data_cid)
        + r"(\"|')[^>]*(?P<selfclosing>/?)>",
        re.IGNORECASE,
    )
    matches = list(pattern.finditer(html))
    if not matches:
        raise BlockUpdateError(
            f"Element with data-cid '{data_cid}' not found."
        )
    if len(matches) > 1:
        raise BlockUpdateError(
            f"Multiple elements found with data-cid '{data_cid}'."
        )

    match = matches[0]
    start_index = match.start()
    tag_name = match.group("tag")
    self_closing = match.group("selfclosing") == "/"

    void_tags = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }
    if self_closing or tag_name.lower() in void_tags:
        if not _is_full_tag_replacement(tag_name, new_html, is_void=True):
            raise BlockUpdateError(
                f"Replacement html does not fully cover <{tag_name}> element."
            )
        end_index = match.end()
    else:
        if not _is_full_tag_replacement(tag_name, new_html, is_void=False):
            raise BlockUpdateError(
                f"Replacement html does not fully cover <{tag_name}> element."
            )
        tag_pattern = re.compile(
            rf"<(/?){re.escape(tag_name)}\b[^>]*>", re.IGNORECASE
        )
        depth = 0
        end_index = None

        for tag_match in tag_pattern.finditer(html, match.start()):
            if tag_match.start() == match.start():
                depth = 1
                continue
            if depth == 0:
                continue
            if tag_match.group(1) == "/":
                depth -= 1
            else:
                depth += 1
            if depth == 0:
                end_index = tag_match.end()
                break

        if end_index is None:
            raise BlockUpdateError(
                f"Closing </{tag_name}> not found for data-cid '{data_cid}'."
            )

    updated_html = html[:start_index] + new_html + html[end_index:]
    replacement_end_index = start_index + len(new_html)
    return updated_html, replacement_end_index


def _is_full_tag_replacement(tag_name: str, new_html: str, is_void: bool) -> bool:
    stripped = new_html.strip()
    if not stripped:
        return False
    if is_void:
        pattern = re.compile(
            rf"^<{re.escape(tag_name)}\b[^>]*?/?>$",
            re.IGNORECASE | re.DOTALL,
        )
        return bool(pattern.match(stripped))
    pattern = re.compile(
        rf"^<{re.escape(tag_name)}\b[^>]*>.*</{re.escape(tag_name)}>$",
        re.IGNORECASE | re.DOTALL,
    )
    return bool(pattern.match(stripped))


@dataclass
class BlockUpdateState:
    current_html: str
    streamed_length: int = 0
    applied_ops: int = 0


class BlockUpdateStreamProcessor:
    def __init__(
        self,
        base_html: str,
        send_chunk: Callable[[str], Awaitable[None]],
    ) -> None:
        self._state = BlockUpdateState(current_html=base_html)
        self._send_chunk = send_chunk
        self._buffer = ""
        self._is_capturing = False

    @property
    def current_html(self) -> str:
        return self._state.current_html

    @property
    def applied_ops(self) -> int:
        return self._state.applied_ops

    async def process_chunk(self, content: str) -> None:
        self._buffer += content
        await self._extract_ops_from_buffer()

    async def process_full_response(self, content: str) -> None:
        self._buffer += content
        await self._extract_ops_from_buffer(flush=True)

    async def _extract_ops_from_buffer(self, flush: bool = False) -> None:
        while self._buffer:
            if not self._is_capturing:
                start_index = self._buffer.find("```toml")
                if start_index == -1:
                    if not flush:
                        self._buffer = self._buffer[-8:]
                    else:
                        self._buffer = ""
                    break
                self._buffer = self._buffer[start_index + len("```toml") :]
                if self._buffer.startswith("\n"):
                    self._buffer = self._buffer[1:]
                self._is_capturing = True

            end_index = self._buffer.find("```")
            if end_index == -1:
                if flush:
                    raise BlockUpdateError("Unterminated TOML fence in output.")
                break

            toml_payload = self._buffer[:end_index].strip()
            self._buffer = self._buffer[end_index + len("```") :]
            self._is_capturing = False

            if not toml_payload:
                continue

            try:
                op = tomllib.loads(toml_payload)
            except tomllib.TOMLDecodeError as exc:
                raise BlockUpdateError("Invalid TOML block update payload.") from exc

            await self._apply_op(op)

    async def _apply_op(self, op: dict[str, Any]) -> None:
        if "dataCid" in op:
            data_cid = op.get("dataCid")
            new_html = op.get("html")
            if not data_cid or not isinstance(new_html, str):
                raise BlockUpdateError("dataCid ops must include an html field.")
            try:
                updated_html, end_index = replace_tag_by_data_cid(
                    self._state.current_html, str(data_cid), new_html
                )
            except BlockUpdateError as exc:
                logger.warning(
                    "Block update dataCid failed for %s: %s", data_cid, exc
                )
                return
        elif "old" in op and "new" in op:
            old_html = op.get("old")
            new_html = op.get("new")
            if not isinstance(old_html, str) or not isinstance(new_html, str):
                raise BlockUpdateError("replace ops must include old and new strings.")
            try:
                updated_html, end_index = replace_first_occurrence(
                    self._state.current_html, old_html, new_html
                )
            except BlockUpdateError as exc:
                logger.warning("Block update old/new failed: %s", exc)
                return
        else:
            raise BlockUpdateError("Unknown block update operation.")

        self._state.current_html = updated_html
        self._state.applied_ops += 1
        await self._stream_until(end_index)

    async def _stream_until(self, end_index: int) -> None:
        if end_index < self._state.streamed_length:
            self._state.streamed_length = 0
        if end_index <= self._state.streamed_length:
            return
        delta = self._state.current_html[self._state.streamed_length : end_index]
        if delta:
            await self._send_chunk(delta)
        self._state.streamed_length = end_index
