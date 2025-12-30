from flask import Blueprint, request, jsonify
from app.services.rag_service import RagService

rag_bp = Blueprint("rag", __name__)
rag_service = RagService()

@rag_bp.route("/load-files", methods=["POST"])
def load_files():
    data = request.get_json()
    file_paths = data.get("file_paths", [])
    if not file_paths:
        return jsonify({"status": "fail", "msg": "file_paths不能为空"}), 400
    metadatas = data.get("metadatas")
    res = rag_service.load_and_index_files(file_paths, metadatas)
    return jsonify(res)

@rag_bp.route("/query", methods=["POST"])
def rag_query():
    data = request.get_json()
    query = data.get("query")
    if not query:
        return jsonify({"status": "fail", "msg": "query不能为空"}), 400
    top_k = data.get("top_k", 3)
    res = rag_service.rag_answer(query, top_k)
    return jsonify(res)

@rag_bp.route("/stats", methods=["GET"])
def stats():
    return jsonify(rag_service.get_index_stats())

@rag_bp.route("/clear", methods=["DELETE"])
def clear():
    return jsonify(rag_service.clear_index())

@rag_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "rag-backend"})
