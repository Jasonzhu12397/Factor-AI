from flask import Flask

def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object("app.core.config.Config")

    from app.api.endpoints import rag_bp
    app.register_blueprint(rag_bp, url_prefix="/api/rag")

    return app
