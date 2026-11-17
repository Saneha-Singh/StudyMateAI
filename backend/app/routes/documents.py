
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.core.document_processor import extract_document_text
from app.core.rag_engine import add_document

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    filename = file.filename or ""

    if "." not in filename:
        raise HTTPException(400, "Invalid filename")

    extension = filename.rsplit(".", 1)[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            "Only PDF, DOCX and PPTX files are supported"
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(400, "The uploaded file is empty")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(413, "File size exceeds 15 MB")

    try:
        extracted_text = extract_document_text(
            filename,
            file_bytes
        )
    except Exception as e:
        raise HTTPException(
            400,
            f"Could not process document: {str(e)}"
        )

    if not extracted_text.strip():
        raise HTTPException(
            400,
            "No readable text found in this document"
        )

    document = Document(
        filename=filename,
        file_type=extension,
        extracted_text=extracted_text
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Add extracted document text to ChromaDB
    add_document(
        document_id=document.id,
        filename=document.filename,
        text=document.extracted_text
    )

    return document


@router.get("/", response_model=list[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(
        Document.created_at.desc()
    ).all()


@router.get("/{document_id}/text")
def get_document_text(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.get(Document, document_id)

    if not document:
        raise HTTPException(404, "Document not found")

    return {
        "id": document.id,
        "filename": document.filename,
        "extracted_text": document.extracted_text
    }


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.get(Document, document_id)

    if not document:
        raise HTTPException(404, "Document not found")

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
