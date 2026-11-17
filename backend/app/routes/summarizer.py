
import re
import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.document import Document
from app.core.summarizer import generate_summary, extract_keywords


router = APIRouter(
    prefix="/summarizer",
    tags=["Summarizer"]
)


@router.post("/{document_id}")
def summarize_document(
    document_id: int,
    min_sentences: int = 10,
    max_sentences: int = 15,
    db: Session = Depends(get_db)
):

    # Validate summary length
    if (
        min_sentences < 1
        or max_sentences > 25
        or min_sentences > max_sentences
    ):
        raise HTTPException(
            status_code=400,
            detail="Summary length must be between 1 and 25, with minimum not exceeding maximum."
        )

    # Find document
    document = db.get(Document, document_id)

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if not document.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="The selected document contains no extractable text."
        )

    try:

        summary = generate_summary(
            document.extracted_text,
            min_sentences=min_sentences,
            max_sentences=max_sentences
        )

        keywords = extract_keywords(
            document.extracted_text,
            max_keywords=10
        )

    except Exception as e:

        traceback.print_exc()

        raise HTTPException(
            status_code=502,
            detail=f"Summary generation failed: {str(e)}"
        )

    summary_sentences = (
        len(re.findall(r"[.!?]+", summary))
        if summary else 0
    )

    return {
        "document_id": document.id,
        "filename": document.filename,
        "summary": summary,
        "summary_sentences": summary_sentences,
        "keywords": keywords
    }
