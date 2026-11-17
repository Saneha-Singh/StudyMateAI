
from pydantic import BaseModel


class ChatRequest(BaseModel):
    document_id: int
    question: str


class ChatResponse(BaseModel):
    document_id: int
    question: str
    answer: str
    sources: list[dict]
