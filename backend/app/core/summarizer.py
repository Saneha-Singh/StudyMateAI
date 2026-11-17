
import os
import re
import logging
from collections import Counter

from dotenv import load_dotenv
from groq import Groq
from rake_nltk import Rake
from nltk.corpus import stopwords

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MODEL = "openai/gpt-oss-20b"


# --------------------------------------------------
# TEXT PREPROCESSING
# --------------------------------------------------

def get_stop_words():
    try:
        return set(stopwords.words("english"))
    except LookupError:
        return {
            "the", "is", "are", "was", "were", "a", "an",
            "and", "or", "of", "to", "in", "on", "for",
            "with", "by", "as", "at", "this", "that",
            "these", "those", "it", "be", "can", "will",
            "from", "we", "you", "they", "their", "its",
            "which", "what", "when", "where", "how", "why"
        }


def preprocess_text(text: str) -> str:
    """Clean extracted text while preserving useful structure."""

    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove page and slide markers
    text = re.sub(
        r"---\s*(?:Page|Slide)\s+\d+\s*---",
        "\n",
        text,
        flags=re.IGNORECASE
    )

    # Remove decorative symbols
    text = re.sub(r"[●▪◦■◆►]", " ", text)

    # Remove excessive spaces without destroying newlines
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Fix spaces before punctuation
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)

    return text.strip()


# --------------------------------------------------
# KEYWORD EXTRACTION - RAKE
# --------------------------------------------------

def extract_keywords(text: str, max_keywords: int = 10):
    """Extract important phrases using RAKE."""

    cleaned_text = preprocess_text(text)

    if not cleaned_text:
        return []

    try:
        rake = Rake(
            stopwords=get_stop_words(),
            min_length=1,
            max_length=3
        )

        rake.extract_keywords_from_text(cleaned_text)

        ranked_keywords = rake.get_ranked_phrases_with_scores()

    except Exception:
        logger.exception("RAKE keyword extraction failed")
        return []

    results = []
    seen = set()

    for score, phrase in ranked_keywords:

        phrase = re.sub(
            r"[^a-zA-Z0-9\s+#-]",
            "",
            phrase
        )

        phrase = " ".join(phrase.split()).strip()
        normalized = phrase.lower()

        if len(phrase) < 3 or len(phrase.split()) > 3:
            continue

        if normalized in seen:
            continue

        seen.add(normalized)

        results.append({
            "keyword": phrase,
            "score": round(float(score), 2)
        })

        if len(results) >= max_keywords:
            break

    return results


# --------------------------------------------------
# LOCAL EXTRACTIVE FALLBACK
# --------------------------------------------------

def tokenize(text: str, stop_words: set):
    words = re.findall(
        r"\b[a-zA-Z0-9+#-]+\b",
        text.lower()
    )

    return [
        word for word in words
        if word not in stop_words and len(word) > 1
    ]


def extractive_fallback(
    text: str,
    min_sentences: int = 10,
    max_sentences: int = 15
):
    """
    Local extractive summarization.
    Used when Groq is unavailable.
    """

    sentences = re.split(r"(?<=[.!?])\s+", text)

    sentences = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.split()) >= 5
    ]

    if not sentences:
        return text[:1500]

    stop_words = get_stop_words()

    frequencies = Counter()

    tokenized = [
        tokenize(sentence, stop_words)
        for sentence in sentences
    ]

    for words in tokenized:
        frequencies.update(words)

    if not frequencies:
        return " ".join(sentences[:max_sentences])

    max_frequency = max(frequencies.values())

    scored = []

    for index, (sentence, words) in enumerate(
        zip(sentences, tokenized)
    ):

        if not words:
            continue

        score = sum(
            frequencies[word] / max_frequency
            for word in words
        )

        score /= max(len(words) ** 0.5, 1)

        position_bonus = 1 - (
            index / max(len(sentences), 1)
        ) * 0.15

        scored.append((
            score * position_bonus,
            index,
            sentence
        ))

    selected = sorted(
        scored,
        key=lambda item: item[0],
        reverse=True
    )[:max_sentences]

    selected.sort(key=lambda item: item[1])

    return "\n\n".join(
        f"- {item[2]}" for item in selected
    )


# --------------------------------------------------
# DOCUMENT CHUNKING
# --------------------------------------------------

def split_into_chunks(text: str, max_chars: int = 12000):
    """Split long documents into manageable chunks."""

    words = text.split()

    chunks = []
    current_chunk = []
    current_length = 0

    for word in words:

        if current_length + len(word) + 1 > max_chars:

            if current_chunk:
                chunks.append(" ".join(current_chunk))

            current_chunk = []
            current_length = 0

        current_chunk.append(word)
        current_length += len(word) + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


# --------------------------------------------------
# GROQ ABSTRACTION
# --------------------------------------------------

def summarize_chunk(
    text: str,
    min_sentences: int,
    max_sentences: int
):
    """Generate an abstractive summary using Groq."""

    prompt = f"""
You are StudyMate AI, an expert academic study assistant.

Summarize the following educational material accurately.

SUMMARY LENGTH:
Write between {min_sentences} and {max_sentences}
main explanatory sentences.

IMPORTANT REQUIREMENTS:

1. Preserve important concepts and technical terminology.
2. Do not invent information.
3. Explain concepts in simple, student-friendly language.
4. Organize the content using meaningful Markdown headings.
5. Use bullet points for important details.
6. Use numbered lists only for actual sequences or steps.
7. Use Markdown tables only for direct comparisons.
8. Never put mathematical equations inside tables.
9. Write mathematical expressions using LaTeX.
10. Use $$...$$ for standalone equations.
11. Do not output raw HTML tags.
12. Remove page numbers and slide numbers.
13. Avoid unnecessary repetition.
14. Keep the summary academically useful.
15. Do not create excessive headings.
16. Keep paragraphs short and readable.
17. Prioritize important concepts over minor examples.

VERY IMPORTANT:
Stay within the requested sentence range as closely as possible.
Do not count headings, bullet labels or equations as sentences.
Do not add unnecessary sentences just to fill space.

Return only the summary in clean Markdown.

DOCUMENT:
{text}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You generate accurate, structured academic "
                    "summaries based strictly on the supplied text. "
                    "Use concise Markdown formatting."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_tokens=1800
    )

    answer = response.choices[0].message.content

    if not answer or not answer.strip():
        raise ValueError("Groq returned an empty summary")

    return answer.strip()


# --------------------------------------------------
# MAIN SUMMARY GENERATOR
# --------------------------------------------------

def generate_summary(
    text: str,
    min_sentences: int = 10,
    max_sentences: int = 15
):
    """
    Generate an abstractive summary using Groq.

    Long documents are summarized in chunks.
    Falls back to extractive summarization if Groq fails.
    """

    cleaned_text = preprocess_text(text)

    if not cleaned_text:
        return ""

    if (
        min_sentences < 1
        or max_sentences > 25
        or min_sentences > max_sentences
    ):
        raise ValueError("Invalid summary length range")

    # Groq unavailable: use local fallback
    if not client:

        logger.warning(
            "GROQ_API_KEY is missing. Using extractive fallback."
        )

        return extractive_fallback(
            cleaned_text,
            min_sentences,
            max_sentences
        )

    try:

        chunks = split_into_chunks(cleaned_text)

        # Short document: direct summarization
        if len(chunks) == 1:

            return summarize_chunk(
                chunks[0],
                min_sentences,
                max_sentences
            )

        # Long document: summarize each chunk first
        intermediate_summaries = []

        for index, chunk in enumerate(chunks):

            logger.info(
                "Summarizing chunk %s of %s",
                index + 1,
                len(chunks)
            )

            intermediate_summaries.append(
                summarize_chunk(
                    chunk,
                    3,
                    5
                )
            )

        # Combine intermediate summaries
        combined_text = "\n\n".join(
            intermediate_summaries
        )

        # Generate the final summary
        return summarize_chunk(
            combined_text,
            min_sentences,
            max_sentences
        )

    except Exception:

        logger.exception(
            "Groq summarization failed. "
            "Using local extractive fallback."
        )

        return extractive_fallback(
            cleaned_text,
            min_sentences,
            max_sentences
        )
