
import joblib

model_data = joblib.load("task_classifier.joblib")

vectorizer = model_data["vectorizer"]
category_model = model_data["category_model"]
priority_model = model_data["priority_model"]

test_tasks = [
    "I have my DBMS final tomorrow and need to revise normalization",
    "Finish the React dashboard and connect it to the FastAPI backend",
    "Buy groceries and organise my study table",
    "Complete the machine learning lab report before submission",
    "Spend an hour understanding binary search trees"
]

for task in test_tasks:
    features = vectorizer.transform([task])

    category = category_model.predict(features)[0]
    priority = priority_model.predict(features)[0]

    print("\nTask:", task)
    print("Predicted category:", category)
    print("Predicted priority:", priority)
