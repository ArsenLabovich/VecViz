"""Optional AI-generated cluster labels using GPT-4o-mini."""
from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger("vecviz")


async def generate_label(texts: list[str]) -> str:
    """Given a sample of texts from a cluster, return a 2-3 word label."""
    if not texts:
        return "Cluster"
    if settings.use_local_embeddings or not settings.openai_api_key:
        # Fallback: use most common words
        return _naive_label(texts)

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        sample = "\n---\n".join(t[:300] for t in texts[:8])
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Give a 2-3 word label (noun phrase) for this group of text chunks. "
                        "Respond with ONLY the label, no punctuation:\n\n" + sample
                    ),
                }
            ],
            max_tokens=20,
            temperature=0.2,
        )
        label = response.choices[0].message.content or ""
        return label.strip()[:64]
    except Exception as e:
        logger.warning("Label generation failed: %s", e)
        return _naive_label(texts)


def _naive_label(texts: list[str]) -> str:
    from collections import Counter
    import re

    words = re.findall(r"\b[a-zA-Z]{4,}\b", " ".join(texts[:5]).lower())
    stopwords = {"that", "this", "with", "from", "have", "been", "they", "their", "into"}
    filtered = [w for w in words if w not in stopwords]
    common = Counter(filtered).most_common(3)
    if common:
        return " ".join(w for w, _ in common[:2]).title()
    return "Cluster"
