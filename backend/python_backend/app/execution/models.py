# python_backend/app/execution/models.py
"""SQLAlchemy models for the execution engine.

- Execution: top‑level record for a code run (submission reference, language, status).
- ExecutionResult: stores overall result (stdout, stderr, exit_code, time, memory).
- TestCaseResult: stores per‑test‑case outcome when multiple test cases are supplied.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class Execution(Base):
    __tablename__ = "executions"
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    language = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, running, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    result = relationship("ExecutionResult", uselist=False, back_populates="execution", cascade="all, delete-orphan")
    test_case_results = relationship("TestCaseResult", back_populates="execution", cascade="all, delete-orphan")

class ExecutionResult(Base):
    __tablename__ = "execution_results"
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False, unique=True)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    exit_code = Column(Integer, nullable=True)
    time = Column(Float, nullable=True)  # seconds
    memory = Column(Integer, nullable=True)  # kilobytes
    compiled_successfully = Column(Boolean, nullable=False, default=True)

    execution = relationship("Execution", back_populates="result")

class TestCaseResult(Base):
    __tablename__ = "test_case_results"
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False)
    test_case_id = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    exit_code = Column(Integer, nullable=True)
    time = Column(Float, nullable=True)
    memory = Column(Integer, nullable=True)

    execution = relationship("Execution", back_populates="test_case_results")
