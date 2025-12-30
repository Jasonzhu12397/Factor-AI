import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Optional
from app.core.config import config

class VectorService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=config.VECTOR_DB_PERSIST_DIR)
        self.embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=config.EMBEDDING_MODEL,
            device=config.MODEL_DEVICE
        )
        self.collection = self.client.get_or_create_collection(
            name="rag_collection",
            embedding_function=self.embedding_func,
            metadata={"description": "RAG Core Collection"}
        )

    def add_documents(self, documents: List[str], metadatas: Optional[List[Dict]] = None, ids: Optional[List[str]] = None) -> None:
        self.collection.add(documents=documents, metadatas=metadatas or [], ids=ids or [])

    def similarity_search(self, query: str, top_k: int = 3) -> List[Dict]:
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        formatted_results = []
        for i in range(len(results["documents"][0])):
            formatted_results.append({
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i] if results["metadatas"][0] else None,
                "similarity_score": 1 - results["distances"][0][i]
            })
        return formatted_results

    def clear_collection(self) -> None:
        self.collection.delete(ids=self.collection.get()["ids"])

    def get_collection_stats(self) -> int:
        return self.collection.count()
