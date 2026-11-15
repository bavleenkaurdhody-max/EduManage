from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse

load_dotenv()
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
MONGO_URI = os.getenv("MONGO_URI")
conn = MongoClient(MONGO_URI)

class Student(BaseModel):
    name: str
    age: int
    course: str

@app.get("/", response_class=HTMLResponse)
async def show_item(request: Request):

    docs = conn.notes.student.find({})
    recent_students = conn.notes.student.find().sort("_id", -1).limit(5)
    recent_students_list = []
    for student in recent_students:
        recent_students_list.append({
        "id": str(student["_id"]),
        "name": student["name"],
        "rollno": student["rollno"],
        "class_name": student["class_name"],
        "section": student["section"],
        "status": student["status"]
    })
    newdocs = []

    for doc in docs:
        newdocs.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "rollno": doc["rollno"],
            "gender": doc["gender"],
            "email": doc["email"],
            "phone": doc["phone"],
            "class_name": doc["class_name"],
            "section": doc["section"],
            "admission_date": doc["admission_date"],
            "status": doc["status"]
        })
        total_students = conn.notes.student.count_documents({})
        print("Total:", total_students)
        
    
    
        active_students = conn.notes.student.count_documents(
        {"status": "Active"}
        )
        print("Active:", active_students)
        inactive_students = conn.notes.student.count_documents(
        {"status": "Inactive"}
        )
        print("Inactive:", inactive_students)
        total_classes = len(
        conn.notes.student.distinct("class_name")
        )
        print("Classes:", total_classes)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
                    "students": newdocs,
                    "total_students": total_students,
                    "active_students": active_students,
                    "inactive_students": inactive_students,
                    "total_classes": total_classes,
                    "recent_students": recent_students_list
            }
    )
@app.get("/view_student", response_class=HTMLResponse)
async def read_item(
    request: Request,
    page: int = 1
):
    per_page = 10
    skip = (page - 1) * per_page
    docs = (
    conn.notes.student
    .find({})
    .sort("_id", -1)
    .skip(skip)
    .limit(per_page)
)
    newdocs = []

    for doc in docs:
        newdocs.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "rollno": doc["rollno"],
            "gender": doc["gender"],
            "email": doc["email"],
            "phone": doc["phone"],
            "class_name": doc["class_name"],
            "section": doc["section"],
            "admission_date": doc["admission_date"],
            "status": doc["status"]
        })
    total_students = conn.notes.student.count_documents({})
    import math
    total_pages = math.ceil(total_students / per_page)
    return templates.TemplateResponse(
        request=request,
        name="view_student.html",
        context={
    "students": newdocs,
    "total_students": total_students,
    "page": page,
    "total_pages": total_pages,
}
    )


@app.get("/add_student")
async def add_student(request: Request):
    return templates.TemplateResponse(
        request=request, name="add_student.html"
    )


@app.post("/add_student")
async def adding_student(request: Request):
    form = await request.form()

    student = {
        "name": form.get("name", "").strip(),
        "rollno": form.get("rollno", "").strip(),
        "gender": form.get("gender", "").strip(),
        "email": form.get("email", "").strip(),
        "phone": form.get("phone", "").strip(),
        "class_name": form.get("class_name", "").strip(),
        "section": form.get("section", "").strip(),
        "admission_date": form.get("admission_date", "").strip(),
        "status": form.get("status", "").strip(),
    }
    existing_student = conn.notes.student.find_one(
    {
        "rollno": student["rollno"]
    }
    )

    if existing_student:
        return HTMLResponse(
        "<h2>Roll Number already exists.</h2>",
        status_code=400
    )
    conn.notes.student.insert_one(student)

    return RedirectResponse(
        url="/add_student",
        status_code=303
    )

@app.get("/view_student/{student_id}")
async def view_details(student_id,request: Request):
    details = conn.notes.student.find_one({"_id":ObjectId(student_id)})
    return templates.TemplateResponse(
        request=request, name="student_details.html" ,context={"student":details}
    )
@app.get("/search_student")
async def search_student(request: Request,query: str = ""):
    if query:
        docs = conn.notes.student.find(
        {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"rollno": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"class_name": {"$regex": query, "$options": "i"}}
            ]
        }
    )
        print("Query:", query)
    else:
        docs = []
    students = []

    for doc in docs:
        students.append({
        "id": str(doc["_id"]),
        "name": doc["name"],
        "rollno": doc["rollno"],
        "email": doc["email"],
        "class_name": doc["class_name"],
        "section": doc["section"],
        "status": doc["status"]
    })    
        print(students)
    return templates.TemplateResponse(
    request=request,
    name="search_student.html",
    context={
        "students": students,
        "query": query
    }
)



@app.get("/update_student/{student_id}")
async def update_student(student_id, request: Request):

    details = conn.notes.student.find_one(
        {"_id": ObjectId(student_id)}
    )

    details["id"] = str(details["_id"])

    return templates.TemplateResponse(
        request=request,
        name="update_student.html",
        context={"student": details}
    )


@app.post("/update_student/{student_id}")
async def update_info(student_id, request: Request):

    form = await request.form()

    conn.notes.student.update_one(
        {"_id": ObjectId(student_id)},
        {
            "$set": dict(form)
        }
    )

    return RedirectResponse(
        url=f"/view_student/{student_id}",
        status_code=303
    )
@app.get("/delete_student/{student_id}")
async def delete_student(student_id, request: Request):

    details = conn.notes.student.find_one(
        {"_id": ObjectId(student_id)}
    )

    details["id"] = str(details["_id"])

    return templates.TemplateResponse(
        request=request,
        name="delete_student.html",
        context={"student": details}
    )

@app.post("/delete_student/{student_id}")
async def delete(student_id):

    conn.notes.student.delete_one(
        {"_id": ObjectId(student_id)}
    )

    return RedirectResponse(
        url="/view_student",
        status_code=303
    )