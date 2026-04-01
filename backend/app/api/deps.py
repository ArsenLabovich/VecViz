from app.services.embedding import get_embedder, BaseEmbedder


def get_embedder_dep() -> BaseEmbedder:
    return get_embedder()
