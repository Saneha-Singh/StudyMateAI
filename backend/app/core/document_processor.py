
import re
import fitz

from docx import Document
from pptx import Presentation
from io import BytesIO


def clean_text(text: str) -> str:
    """
    Clean extracted text while preserving meaningful
    words, punctuation and paragraph boundaries.
    """

    if not text:
        return ""

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove null characters and unwanted control characters
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Normalize spaces and tabs without removing line breaks
    text = re.sub(r"[ \t]+", " ", text)

    # Remove spaces before punctuation
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)

    # Remove spaces immediately after opening brackets
    text = re.sub(r"([\(\[\{])\s+", r"\1", text)

    # Remove spaces immediately before closing brackets
    text = re.sub(r"\s+([\)\]\}])", r"\1", text)

    # Normalize excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract PDF text page by page.

    Uses text blocks to preserve paragraph boundaries
    and improves the separation of headings and content.
    """

    text = []

    pdf = fitz.open(
        stream=file_bytes,
        filetype="pdf"
    )

    try:
        for page_number, page in enumerate(pdf, start=1):

            blocks = page.get_text("blocks", sort=True)

            page_content = []

            for block in blocks:

                # Ignore image blocks and empty blocks
                if len(block) < 5:
                    continue

                block_text = block[4]

                if not block_text or not block_text.strip():
                    continue

                cleaned_block = clean_text(block_text)

                if cleaned_block:
                    page_content.append(cleaned_block)

            if page_content:
                page_text = "\n\n".join(page_content)

                text.append(
                    f"--- Page {page_number} ---\n{page_text}"
                )

    finally:
        pdf.close()

    return "\n\n".join(text)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract DOCX paragraphs and table contents.
    """

    document = Document(BytesIO(file_bytes))

    content = []

    # Extract paragraphs
    for paragraph in document.paragraphs:

        paragraph_text = clean_text(paragraph.text)

        if paragraph_text:
            content.append(paragraph_text)

    # Extract tables
    for table in document.tables:

        for row in table.rows:

            row_content = []

            for cell in row.cells:

                cell_text = clean_text(cell.text)

                if cell_text:
                    row_content.append(cell_text)

            if row_content:
                content.append(" | ".join(row_content))

    return "\n\n".join(content)


def extract_text_from_pptx(file_bytes: bytes) -> str:
    """
    Extract PowerPoint slide text while preserving
    slide boundaries and paragraph separation.
    """

    presentation = Presentation(BytesIO(file_bytes))

    slides_text = []

    for slide_number, slide in enumerate(
        presentation.slides,
        start=1
    ):

        slide_content = []

        for shape in slide.shapes:

            if not shape.has_text_frame:
                continue

            paragraphs = []

            for paragraph in shape.text_frame.paragraphs:

                paragraph_text = clean_text(paragraph.text)

                if paragraph_text:
                    paragraphs.append(paragraph_text)

            if paragraphs:
                slide_content.append("\n".join(paragraphs))

        if slide_content:

            slides_text.append(
                f"--- Slide {slide_number} ---\n"
                + "\n\n".join(slide_content)
            )

    return "\n\n".join(slides_text)


def extract_document_text(filename: str, file_bytes: bytes) -> str:
    """
    Route document extraction based on file extension.

    Supported formats: PDF, DOCX and PPTX.
    """

    extension = filename.lower().rsplit(".", 1)[-1]

    if extension == "pdf":
        return extract_text_from_pdf(file_bytes)

    elif extension == "docx":
        return extract_text_from_docx(file_bytes)

    elif extension == "pptx":
        return extract_text_from_pptx(file_bytes)

    else:
        raise ValueError(
            "Unsupported file format. Upload PDF, DOCX or PPTX."
        )
