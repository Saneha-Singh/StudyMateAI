
from datetime import datetime, date, time, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.task import Task
from app.models.task_activity import TaskActivity
from app.models.note import Note
from app.models.document import Document

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/")
def get_analytics(db: Session = Depends(get_db)):

    total_tasks = db.query(Task).count()

    completed = db.query(Task).filter(
        Task.status == "Completed"
    ).count()

    pending = db.query(Task).filter(
        Task.status == "Pending"
    ).count()

    in_progress = db.query(Task).filter(
        Task.status == "In Progress"
    ).count()

    completion_rate = (
        round(completed / total_tasks * 100, 2)
        if total_tasks else 0
    )

    priority_results = (
        db.query(Task.priority, func.count(Task.id))
        .group_by(Task.priority)
        .all()
    )

    category_results = (
        db.query(Task.category, func.count(Task.id))
        .group_by(Task.category)
        .all()
    )

    priority_distribution = {
        priority: count for priority, count in priority_results
    }

    category_distribution = {
        category: count for category, count in category_results
    }

    total_notes = db.query(Note).count()
    total_documents = db.query(Document).count()

    # Flat keys support the existing React frontend.
    # Nested task_statistics is retained for compatibility.
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "in_progress_tasks": in_progress,
        "completion_rate": completion_rate,

        "task_statistics": {
            "total_tasks": total_tasks,
            "completed": completed,
            "pending": pending,
            "in_progress": in_progress,
            "completion_rate": completion_rate
        },

        "priority_distribution": priority_distribution,
        "category_distribution": category_distribution,
        "total_notes": total_notes,
        "total_documents": total_documents
    }


def normalize_datetime(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


@router.get("/productivity")
def get_productivity_history(
    days: int = Query(default=60, ge=7, le=365),
    group_by: str = Query(default="daily", pattern="^(daily|weekly)$"),
    db: Session = Depends(get_db)
):
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)

    events = (
        db.query(TaskActivity)
        .filter(TaskActivity.occurred_at < datetime.combine(
            today + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc
        ))
        .order_by(TaskActivity.occurred_at.asc(), TaskActivity.id.asc())
        .all()
    )

    # Replay events to reconstruct the real task state on each date.
    active_tasks = 0
    completed_tasks = 0
    event_index = 0

    daily_points = []

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)

        while event_index < len(events):
            event = events[event_index]
            event_date = normalize_datetime(event.occurred_at).date()

            if event_date > current_date:
                break

            if event.event_type == "created":
                active_tasks += 1

                if event.to_status == "Completed":
                    completed_tasks += 1

            elif event.event_type == "status_changed":
                if event.from_status == "Completed":
                    completed_tasks -= 1

                if event.to_status == "Completed":
                    completed_tasks += 1

            elif event.event_type == "deleted":
                active_tasks -= 1

                if event.from_status == "Completed":
                    completed_tasks -= 1

            event_index += 1

        # Avoid negative values if the database contains inconsistent events.
        active = max(0, active_tasks)
        completed = max(0, min(completed_tasks, active))

        productivity = (
            round(completed / active * 100, 2)
            if active else 0
        )

        daily_points.append({
            "date": current_date.isoformat(),
            "total_tasks": active,
            "completed_tasks": completed,
            "productivity": productivity
        })

    if group_by == "weekly":
        weekly_points = {}

        for point in daily_points:
            point_date = date.fromisoformat(point["date"])
            week_start = point_date - timedelta(days=point_date.weekday())
            key = week_start.isoformat()

            # Keep the last daily snapshot of each week.
            weekly_points[key] = {
                **point,
                "date": key
            }

        result = list(weekly_points.values())
    else:
        result = daily_points

    # Linear regression over the displayed productivity values.
    n = len(result)

    if n >= 2:
        sum_x = sum(range(n))
        sum_y = sum(p["productivity"] for p in result)
        sum_xy = sum(
            i * p["productivity"] for i, p in enumerate(result)
        )
        sum_xx = sum(i * i for i in range(n))

        denominator = n * sum_xx - sum_x * sum_x

        slope = (
            (n * sum_xy - sum_x * sum_y) / denominator
            if denominator else 0
        )

        intercept = (sum_y - slope * sum_x) / n

        for i, point in enumerate(result):
            point["trend"] = round(
                max(0, min(100, intercept + slope * i)), 2
            )
    else:
        for point in result:
            point["trend"] = point["productivity"]

    return {
        "period_days": days,
        "group_by": group_by,
        "data": result,
        "history_started": bool(events)
    }
