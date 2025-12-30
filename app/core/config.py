import os
from pydantic import BaseSettings

class Config(BaseSettings):
    DEBUG: bool = True
    PROJECT_NAME: str = "RAG-Backend"
    VECTOR_DB_TYPE: str = "chroma"
    VECTOR_DB_PERSIST_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
    EMBEDDING_DIM: int = 768
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MODEL_DEVICE: str = "cpu"
    SUPPORTED_FILE_TYPES: list = [".txt", ".pdf", ".docx"]

config = Config()
