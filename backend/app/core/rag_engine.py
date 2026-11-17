
import chromadb
from sentence_transformers import SentenceTransformer


# Initialize the embedding model
embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

# Initialize ChromaDB
client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = client.get_or_create_collection(
    name="studymate_documents"
)


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100):
    words = text.split()
    chunks = []

    start = 0

    while start < len(words):
        end = start + chunk_size

        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def add_document(document_id: int, filename: str, text: str):
    chunks = chunk_text(text)

    if not chunks:
        return 0

    embeddings = embedding_model.encode(
        chunks
    ).tolist()

    ids = [
        f"doc_{document_id}_chunk_{i}"
        for i in range(len(chunks))
    ]

    metadatas = [
        {
            "document_id": document_id,
            "filename": filename,
            "chunk_number": i
        }
        for i in range(len(chunks))
    ]

    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return len(chunks)


def retrieve_relevant_chunks(
    question: str,
    document_id: int,
    top_k: int = 3
):
    question_embedding = embedding_model.encode(
        [question]
    ).tolist()

    results = collection.query(
        query_embeddings=question_embedding,
        n_results=top_k,
        where={"document_id": document_id}
    )

    retrieved_chunks = []

    if results["documents"]:
        for document, metadata in zip(
            results["documents"][0],
            results["metadatas"][0]
        ):
            retrieved_chunks.append({
                "text": document,
                "filename": metadata["filename"],
                "chunk_number": metadata["chunk_number"]
            })

    return retrieved_chunks
