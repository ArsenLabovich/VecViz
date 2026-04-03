"""Document → text chunks pipeline. Supports .txt, .md, .pdf"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger("vecviz")

_TOKENIZER = tiktoken.get_encoding("cl100k_base")
_MAX_CHUNK_TOKENS = 8191  # OpenAI hard limit


@dataclass
class Chunk:
    text: str
    chunk_index: int
    char_start: int
    char_end: int
    token_count: int
    metadata: dict[str, Any]


def _count_tokens(text: str) -> int:
    return len(_TOKENIZER.encode(text))


def _extract_text(content: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(stream=content, filetype="pdf")
            pages = [page.get_text() for page in doc]
            doc.close()
            return "\n\n".join(pages)
        except Exception as e:
            logger.warning("PDF extraction failed for %s: %s", filename, e)
            return content.decode("utf-8", errors="replace")
    # txt / md — decode as UTF-8
    return content.decode("utf-8", errors="replace")


def chunk_document(
    content: bytes,
    filename: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    extra_metadata: dict[str, Any] | None = None,
) -> list[Chunk]:
    text = _extract_text(content, filename)
    if not text.strip():
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size * 4,  # approx chars (1 token ≈ 4 chars)
        chunk_overlap=chunk_overlap * 4,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    raw_chunks = splitter.create_documents([text])
    chunks: list[Chunk] = []
    seen: set[str] = set()
    char_cursor = 0

    for idx, doc in enumerate(raw_chunks):
        chunk_text = doc.page_content.strip()

        # Filter noise
        if len(chunk_text) < 20:
            continue
        if chunk_text in seen:
            continue
        seen.add(chunk_text)

        token_count = _count_tokens(chunk_text)
        if token_count > _MAX_CHUNK_TOKENS:
            logger.warning("Chunk %d exceeds token limit (%d), truncating", idx, token_count)
            chunk_text = _TOKENIZER.decode(_TOKENIZER.encode(chunk_text)[:_MAX_CHUNK_TOKENS])
            token_count = _MAX_CHUNK_TOKENS

        char_start = text.find(chunk_text, char_cursor)
        if char_start == -1:
            char_start = char_cursor
        char_end = char_start + len(chunk_text)
        char_cursor = max(char_cursor, char_start)

        chunks.append(
            Chunk(
                text=chunk_text,
                chunk_index=len(chunks),
                char_start=char_start,
                char_end=char_end,
                token_count=token_count,
                metadata=extra_metadata or {},
            )
        )

    return chunks
