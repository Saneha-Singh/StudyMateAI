
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.task import Task
from app.models.task_activity import TaskActivity
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.core.task_classifier import predict_task_details

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskResponse)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db)
):
    predictions = predict_task_details(
        task_data.title,
        task_data.description or ""
    )

    task_values = task_data.model_dump()

    task_values["category"] = (
        task_values.get("category") or predictions["category"]
    )

    task_values["priority"] = (
        task_values.get("priority") or predictions["priority"]
    )

    task = Task(**task_values)

    db.add(task)
    db.flush()

    db.add(
        TaskActivity(
            task_id=task.id,
            event_type="created",
            to_status=task.status
        )
    )

    db.commit()
    db.refresh(task)

    return task


@router.get("/", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(
        Task.created_at.desc()
    ).all()


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    task = db.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = db.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    old_status = task.status
    updates = task_data.model_dump(exclude_unset=True)

    for key, value in updates.items():
        setattr(task, key, value)

    if task.status != old_status:
        db.add(
            TaskActivity(
                task_id=task.id,
                event_type="status_changed",
                from_status=old_status,
                to_status=task.status
            )
        )

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    task = db.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.add(
        TaskActivity(
            task_id=task.id,
            event_type="deleted",
            from_status=task.status
        )
    )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }
