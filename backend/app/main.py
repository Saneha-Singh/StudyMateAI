from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy import text

from app.database.session import engine
from app.routes.notes import router as notes_router
from app.routes.tasks import router as tasks_router
from app.routes.documents import router as documents_router
from app.routes.summarizer import router as summarizer_router
from app.routes.chat import router as chat_router
from app.routes.analytics import router as analytics_router


app = FastAPI(
    title="StudyMate AI",
    description="AI Powered Personalized Study Assistant",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(notes_router)
app.include_router(tasks_router)
app.include_router(documents_router)
app.include_router(summarizer_router)
app.include_router(chat_router)
app.include_router(analytics_router)


@app.get("/")
def home():
    return {"message": "Welcome to StudyMate AI!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT version()")
            )
            version = result.scalar()

        return {
            "status": "connected",
            "database": "studymate_db",
            "postgresql_version": version
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
