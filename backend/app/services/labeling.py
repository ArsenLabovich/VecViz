"""Chunk and cluster labeling. Uses YAKE for local keyword extraction."""
from __future__ import annotations

import logging
import re
from collections import Counter

logger = logging.getLogger("vecviz")


def _yake_label(text: str) -> str:
    """Extract a 2-3 word keyphraze from text using YAKE."""
    try:
        import yake
        kw = yake.KeywordExtractor(
            lan="en",
            n=3,          # max n-gram size
            top=5,        # number of candidates
            dedupLim=0.7,
        )
        keywords = kw.extract_keywords(text[:1500])
        if keywords:
            # keywords are (phrase, score) — lower score = more relevant
            best = keywords[0][0]
            # Capitalise and trim to max 4 words
            words = best.split()[:4]
            return " ".join(w.capitalize() for w in words)
    except Exception as e:
        logger.debug("YAKE failed: %s", e)
    return _naive_label([text])


def _naive_label(texts: list[str]) -> str:
    words = re.findall(r"\b[a-zA-Z]{4,}\b", " ".join(texts[:5]).lower())
    stopwords = {
        "that", "this", "with", "from", "have", "been", "they", "their",
        "into", "which", "also", "when", "were", "about", "more", "than",
        "some", "would", "could", "should",
    }
    filtered = [w for w in words if w not in stopwords]
    common = Counter(filtered).most_common(3)
    if common:
        return " ".join(w for w, _ in common[:2]).title()
    return "Chunk"


def label_chunk(text: str) -> str:
    """Return a short 2-3 word label for a single chunk."""
    return _yake_label(text)


async def generate_label(texts: list[str]) -> str:
    """Generate cluster label from multiple texts (for cluster-level labeling)."""
    if not texts:
        return "Cluster"
    combined = " ".join(t[:400] for t in texts[:8])
    return _yake_label(combined)
