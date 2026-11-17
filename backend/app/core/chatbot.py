
import os
import logging

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key) if api_key else None


def generate_answer(question: str, retrieved_chunks: list):

    if not retrieved_chunks:
        return {
            "answer": (
                "I couldn't find relevant information "
                "in your uploaded document. Try rephrasing "
                "your question."
            ),
            "mode": "no_relevant_context"
        }

    context = ""

    for index, chunk in enumerate(retrieved_chunks, start=1):
        context += (
            f"\nSource {index}: {chunk['filename']}, "
            f"Chunk {chunk['chunk_number']}\n"
            f"{chunk['text']}\n"
        )

    prompt = f"""
You are StudyMate AI, a helpful study assistant.

Answer the question using ONLY the provided document context.

Instructions:
1. Explain concepts clearly and simply.
2. Do not invent facts.
3. If the context does not contain the answer,
   say that the document does not provide enough information.
4. Mention the supporting source filename and chunk number.
5. Use Markdown headings to organize explanations.
6. Use bullet points for lists.
7. Use Markdown tables only for direct comparisons.
8. NEVER put mathematical equations inside Markdown tables.
9. Always place mathematical equations on separate lines.
10. Use $$ ... $$ for display equations.
11. Explain mathematical symbols below the equation.
12. Do not split a single explanation across multiple table rows.
13. Keep each table row complete and self-contained.
14. Avoid unnecessary tables for step-by-step explanations.
15. Never use HTML tags such as <br> in Markdown.

DOCUMENT CONTEXT:
{context}

STUDENT QUESTION:
{question}

ANSWER:
"""

    if not client:
        return {
            "answer": "Groq API key is missing. Please configure GROQ_API_KEY.",
            "mode": "api_unavailable"
        }

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1500
        )

        answer = response.choices[0].message.content

        if answer:
            return {
                "answer": answer,
                "mode": "llm"
            }

        raise ValueError("Groq returned an empty response")

    except Exception:
        logger.exception("Groq answer generation failed")

        fallback_answer = (
            "The AI answer generator is temporarily unavailable. "
            "However, I found these relevant passages in your document:\n\n"
        )

        for index, chunk in enumerate(retrieved_chunks, start=1):
            fallback_answer += (
                f"**Passage {index}:**\n"
                f"{chunk['text']}\n\n"
            )

        return {
            "answer": fallback_answer,
            "mode": "retrieval_fallback"
        }
