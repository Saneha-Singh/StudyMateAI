
from sqlalchemy import (
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base


class TaskActivity(Base):
    __tablename__ = "task_activity"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    # SET NULL preserves activity history if a task is deleted.
    task_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True
    )

    event_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    from_status: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    to_status: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    occurred_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
