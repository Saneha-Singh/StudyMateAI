
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.document import Document
from app.schemas.chat import ChatRequest
from app.core.rag_engine import retrieve_relevant_chunks
from app.core.chatbot import generate_answer

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/")
def chat_with_document(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    # Check whether the document exists
    document = db.get(Document, request.document_id)

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Retrieve relevant passages from ChromaDB
    retrieved_chunks = retrieve_relevant_chunks(
        question=request.question,
        document_id=request.document_id,
        top_k=3
    )

    # Generate answer using Gemini or fallback
    result = generate_answer(
        request.question,
        retrieved_chunks
    )

    # Prepare source references
    sources = [
        {
            "filename": chunk["filename"],
            "chunk_number": chunk["chunk_number"]
        }
        for chunk in retrieved_chunks
    ]

    return {
        "document_id": request.document_id,
        "question": request.question,
        "answer": result["answer"],
        "response_mode": result["mode"],
        "sources": sources
    }
