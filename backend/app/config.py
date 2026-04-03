from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from enum import Enum


class EmbeddingModel(str, Enum):
    OPENAI_SMALL = "text-embedding-3-small"
    OPENAI_LARGE = "text-embedding-3-large"
    LOCAL_MINILM = "all-MiniLM-L6-v2"


class ReductionMethod(str, Enum):
    UMAP = "umap"
    PACMAP = "pacmap"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Qdrant
    qdrant_host: str = Field(default="localhost")
    qdrant_port: int = Field(default=6333)
    qdrant_url: str = Field(default="")
    qdrant_api_key: str = Field(default="")

    # Embeddings
    openai_api_key: str = Field(default="")
    use_local_embeddings: bool = Field(default=False)
    embedding_model: EmbeddingModel = Field(default=EmbeddingModel.OPENAI_SMALL)

    # Reduction
    reduction_method: ReductionMethod = Field(default=ReductionMethod.UMAP)

    # Models persistence
    models_dir: str = Field(default="/app/models")

    # Logging
    log_level: str = Field(default="info")

    @property
    def embedding_dim(self) -> int:
        if self.use_local_embeddings:
            return 384
        if self.embedding_model == EmbeddingModel.OPENAI_LARGE:
            return 3072
        return 1536


settings = Settings()
