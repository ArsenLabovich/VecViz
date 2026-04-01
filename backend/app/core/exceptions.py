from fastapi import HTTPException, status


class CollectionNotFound(HTTPException):
    def __init__(self, name: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{name}' not found",
        )


class CollectionAlreadyExists(HTTPException):
    def __init__(self, name: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Collection '{name}' already exists",
        )


class PointNotFound(HTTPException):
    def __init__(self, point_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Point '{point_id}' not found",
        )


class EmbeddingError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Embedding generation failed: {detail}",
        )


class ReductionNotReady(HTTPException):
    def __init__(self, collection: str):
        super().__init__(
            status_code=status.HTTP_425_TOO_EARLY,
            detail=f"UMAP model for '{collection}' is not ready yet. Upload documents first.",
        )


class UnsupportedFileType(HTTPException):
    def __init__(self, filename: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: '{filename}'. Supported: .txt, .md, .pdf",
        )
