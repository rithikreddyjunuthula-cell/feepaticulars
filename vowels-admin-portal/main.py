from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Vowels School Admin API", description="API for fee management and student records")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Student(BaseModel):
    id: int
    name: str
    student_class: str
    section: str
    total_fee: float
    due_fee: float

class StudentCreate(BaseModel):
    name: str
    student_class: str
    section: str
    total_fee: float
    due_fee: float

# Mock Data
MOCK_STUDENTS: List[Student] = []

@app.get("/api/students", response_model=List[Student])
async def get_students():
    """Returns the list of students with fee details."""
    return MOCK_STUDENTS

@app.post("/api/students", response_model=Student, status_code=201)
async def create_student(student: StudentCreate):
    """Creates a new student."""
    new_id = max((s.id for s in MOCK_STUDENTS), default=0) + 1
    new_student = Student(id=new_id, **student.dict())
    MOCK_STUDENTS.append(new_student)
    return new_student

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
