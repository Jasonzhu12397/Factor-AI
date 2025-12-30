import os
from app.core.config import config

class FileLoader:
    def __init__(self):
        self.supported = config.SUPPORTED_FILE_TYPES
        try:
            from PyPDF2 import PdfReader
            self.PdfReader = PdfReader
        except ImportError:
            raise ImportError("缺少依赖: pip install PyPDF2")
        try:
            from docx import Document
            self.Document = Document
        except ImportError:
            raise ImportError("缺少依赖: pip install python-docx")

    def load_file(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.supported:
            raise ValueError(f"不支持的格式: {ext}")
        
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        elif ext == ".pdf":
            reader = self.PdfReader(file_path)
            return "".join([page.extract_text() or "" for page in reader.pages])
        elif ext == ".docx":
            doc = self.Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs])
        return ""
