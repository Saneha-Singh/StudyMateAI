
import pandas as pd

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
import joblib


# 1. Load dataset
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "task_classification_dataset.csv"

df = pd.read_csv(DATASET_PATH)

# 2. Basic dataset validation
required_columns = [
    "task_title",
    "description",
    "category",
    "priority"
]

if not all(column in df.columns for column in required_columns):
    raise ValueError("Dataset is missing required columns.")

df = df.dropna(subset=required_columns)

df["text"] = (
    df["task_title"].astype(str) + " " +
    df["description"].astype(str)
)

print("Dataset shape:", df.shape)
print("\nCategory distribution:")
print(df["category"].value_counts())

print("\nPriority distribution:")
print(df["priority"].value_counts())


# 3. Prepare input and labels
X = df["text"]
y_category = df["category"]
y_priority = df["priority"]

# 4. Split data into training and testing sets
X_train, X_test, y_category_train, y_category_test, y_priority_train, y_priority_test = train_test_split(
    X,
    y_category,
    y_priority,
    test_size=0.20,
    random_state=42,
    stratify=y_category
)


# 5. TF-IDF feature extraction
vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words="english",
    ngram_range=(1, 2),
    max_features=5000
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)


# 6. Train category classifier
category_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

category_model.fit(X_train_tfidf, y_category_train)


# 7. Train priority classifier
priority_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

priority_model.fit(X_train_tfidf, y_priority_train)


# 8. Evaluate category model
category_predictions = category_model.predict(X_test_tfidf)

print("\n========== CATEGORY MODEL ==========")
print("Accuracy:", accuracy_score(
    y_category_test,
    category_predictions
))

print(classification_report(
    y_category_test,
    category_predictions,
    zero_division=0
))

print("Category confusion matrix:")
print(confusion_matrix(
    y_category_test,
    category_predictions,
    labels=category_model.classes_
))


# 9. Evaluate priority model
priority_predictions = priority_model.predict(X_test_tfidf)

print("\n========== PRIORITY MODEL ==========")
print("Accuracy:", accuracy_score(
    y_priority_test,
    priority_predictions
))

print(classification_report(
    y_priority_test,
    priority_predictions,
    zero_division=0
))

print("Priority confusion matrix:")
print(confusion_matrix(
    y_priority_test,
    priority_predictions,
    labels=priority_model.classes_
))


# 10. Save trained models and vectorizer
MODEL_PATH = BASE_DIR / "task_classifier.joblib"

joblib.dump(
    {
        "vectorizer": vectorizer,
        "category_model": category_model,
        "priority_model": priority_model
    },
    MODEL_PATH
)

print("\nModels saved successfully!")
print("Saved at:", MODEL_PATH)
