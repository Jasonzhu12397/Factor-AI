from typing import List, Dict, Optional
from app.services.vector_service import VectorService
from app.utils.file_loader import FileLoader

class RagService:
    def __init__(self):
        self.vector_service = VectorService()
        self.file_loader = FileLoader()

    def load_and_index_files(self, file_paths: List[str], metadatas: Optional[List[Dict]] = None) -> Dict:
        if metadatas is None:
            metadatas = [{"file_path": path} for path in file_paths]
        success_count = 0
        failed_files = []
        for path, meta in zip(file_paths, metadatas):
            try:
                doc_text = self.file_loader.load_file(path)
                if not doc_text:
                    failed_files.append({"path": path, "reason": "空文件"})
                    continue
                self.vector_service.add_documents(
                    documents=[doc_text],
                    metadatas=[meta],
                    ids=[f"doc_{hash(path)}_{success_count}"]
                )
                success_count += 1
            except Exception as e:
                failed_files.append({"path": path, "reason": str(e)})
        return {
            "total": len(file_paths),
            "success": success_count,
            "failed": failed_files
        }

    def rag_answer(self, query: str, top_k: int = 3) -> Dict:
        retrieved_docs = self.vector_service.similarity_search(query, top_k)
        if not retrieved_docs:
            return {
                "answer": "未检索到相关内容",
                "docs": [],
                "status": "empty"
            }
        context = "\n\n".join([doc["document"] for doc in retrieved_docs])
        answer = f"根据检索内容回答：{query}\n\n{context}"
        return {
            "answer": answer,
            "docs": retrieved_docs,
            "status": "success"
        }

    def get_index_stats(self) -> Dict:
        return {
            "doc_count": self.vector_service.get_collection_stats(),
            "db_path": config.VECTOR_DB_PERSIST_DIR
        }

    def clear_index(self) -> Dict:
        try:
            self.vector_service.clear_collection()
            return {"status": "success", "msg": "索引已清空"}
        except Exception as e:
            return {"status": "fail", "msg": str(e)}
