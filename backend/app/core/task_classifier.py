
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parents[2] / "task_classifier.joblib"

model_data = joblib.load(MODEL_PATH)

vectorizer = model_data["vectorizer"]
category_model = model_data["category_model"]
priority_model = model_data["priority_model"]


def predict_task_details(title: str, description: str = ""):
    """
    Predict task category and priority using trained
    TF-IDF and Logistic Regression models.
    """

    text = f"{title} {description}".strip()

    features = vectorizer.transform([text])

    category = category_model.predict(features)[0]
    priority = priority_model.predict(features)[0]

    return {
        "category": category,
        "priority": priority
    }
