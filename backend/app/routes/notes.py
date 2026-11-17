
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.note import Note
from app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteResponse
)

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("/", response_model=NoteResponse)
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):
    note = Note(**note_data.model_dump())

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.get("/", response_model=list[NoteResponse])
def get_notes(db: Session = Depends(get_db)):
    return db.query(Note).order_by(
        Note.created_at.desc()
    ).all()


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = db.get(Note, note_id)

    if not note:
        raise HTTPException(404, "Note not found")

    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db)
):
    note = db.get(Note, note_id)

    if not note:
        raise HTTPException(404, "Note not found")

    updates = note_data.model_dump(exclude_unset=True)

    for key, value in updates.items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)

    return note


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = db.get(Note, note_id)

    if not note:
        raise HTTPException(404, "Note not found")

    db.delete(note)
    db.commit()

    return {"message": "Note deleted successfully"}
