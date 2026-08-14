from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from urllib.parse import quote_plus

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from uuid import uuid4
from collections import defaultdict
import time

from jose import jwt, JWTError
import bcrypt
import random
import string
import os
import re
import requests
from dotenv import load_dotenv


# =========================================================
# ENVIRONMENT
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_FILE)


# =========================================================
# TEXTBEE SMS SETTINGS
# =========================================================

TEXTBEE_API_KEY = os.getenv("TEXTBEE_API_KEY", "").strip()


# =========================================================
# MONGODB SETTINGS
# =========================================================

username = os.getenv("MONGO_USERNAME", "").strip()
password = os.getenv("MONGO_PASSWORD", "").strip()

if not username:
    raise RuntimeError("MONGO_USERNAME is missing from .env")
if not password:
    raise RuntimeError("MONGO_PASSWORD is missing from .env")

encoded_username = quote_plus(username)
encoded_password = quote_plus(password)

uri = (
    f"mongodb+srv://{encoded_username}:{encoded_password}"
    "@cluster0.jcwhpzw.mongodb.net/?appName=Cluster0"
)


# =========================================================
# MONGODB CONNECTION
# =========================================================

client = MongoClient(uri)
db = client["base"]

new_applications = db["newts"]
shortlisted = db["sorted"]
rejected = db["rejected"]
members = db["members"]
admins = db["admins"]
notifica = db["notifications"]
polls = db["polls"]
sms_queue = db["sms_queue"]
sms_daily_log = db["sms_daily_log"]

growth_events = db["growth_events"]
growth_learning = db["growth_learning"]
growth_assignments = db["growth_assignments"]
growth_assignment_submissions = db["growth_assignment_submissions"]
growth_achievements = db["growth_achievements"]


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(title="CREST API", version="1.0.0")


# =========================================================
# RATE LIMITING
# =========================================================

rate_limit_store = defaultdict(list)
RATE_LIMIT_REQUESTS = 60
RATE_LIMIT_WINDOW = 60


def check_rate_limit(ip: str):
    now = time.time()
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[ip]) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    rate_limit_store[ip].append(now)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path != "/":
        client_ip = request.client.host if request.client else "unknown"
        try:
            check_rate_limit(client_ip)
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    response = await call_next(request)
    return response


# =========================================================
# JWT SECURITY
# =========================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# PASSWORD HASHING (Pure bcrypt)
# =========================================================

def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password cannot be empty")
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as error:
        print("Password verification error:", error)
        return False


# =========================================================
# HTTP BEARER + JWT
# =========================================================

security = HTTPBearer()


def create_access_token(email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return {"email": email, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_admin(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_member(current_user=Depends(get_current_user)):
    if current_user["role"] != "member":
        raise HTTPException(status_code=403, detail="Member access required")
    return current_user


# =========================================================
# CORS
# =========================================================

FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MODELS
# =========================================================

class Application(BaseModel):
    name: str
    email: str
    phone: str
    regNo: str
    branch: str
    year: str
    wing: str
    skills: str
    why: str
    portfolio: str


class LoginData(BaseModel):
    email: str
    password: str


class ChangePasswordData(BaseModel):
    current_password: str
    new_password: str


class notifyt(BaseModel):
    msg: str
    audience: str = "All members"


class PollCreate(BaseModel):
    question: str
    options: List[str]


class PollVote(BaseModel):
    option: str


class GrowthEventCreate(BaseModel):
    kind: str = "workshop"
    category: str = "workshop"
    title: str
    instructions: str = ""
    minTeam: int = 1
    maxTeam: int = 1
    lastDate: str = ""
    status: str = "Upcoming"
    question: Optional[Dict[str, Any]] = None


class GrowthEventUpdate(BaseModel):
    kind: Optional[str] = None
    category: Optional[str] = None
    title: Optional[str] = None
    instructions: Optional[str] = None
    minTeam: Optional[int] = None
    maxTeam: Optional[int] = None
    lastDate: Optional[str] = None
    status: Optional[str] = None
    question: Optional[Dict[str, Any]] = None


class GrowthTeamCreate(BaseModel):
    team: str
    memberEmails: List[str] = []


class GrowthAssignmentCreate(BaseModel):
    title: str
    description: str = ""
    wing: str
    link: str = ""
    dueDate: str = ""


class GrowthAssignmentSubmit(BaseModel):
    answer: str = ""


class GrowthLearningStep(BaseModel):
    title: str
    link: str = ""
    description: str = ""


class GrowthLearningCreate(BaseModel):
    type: str = "course"
    title: str
    skill: str = ""
    track: str = ""
    detail: str = ""
    level: str = "Beginner"
    duration: str = ""
    mentor: str = ""
    link: str = ""
    steps: List[GrowthLearningStep] = []


class GrowthAchievementCreate(BaseModel):
    memberEmail: str
    name: str
    year: str = ""
    eventId: Optional[str] = None
    status: str = "winner"


# =========================================================
# SMS SYSTEM + QUEUE
# =========================================================

def get_today_sms_count() -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc = sms_daily_log.find_one({"date": today})
    return doc["count"] if doc else 0


def increment_today_sms_count():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sms_daily_log.update_one(
        {"date": today},
        {"$inc": {"count": 1}, "$setOnInsert": {"date": today}},
        upsert=True
    )


def normalize_phone(phone: str) -> str:
    phone = re.sub(r"[^\d+]", "", phone.strip())
    if phone.startswith("+"):
        return phone
    if phone.startswith("91") and len(phone) == 12:
        return "+" + phone
    if len(phone) == 10:
        return "+91" + phone
    return phone


def send_sms_direct(receiver_phone: str, message: str) -> bool:
    if not TEXTBEE_API_KEY:
        raise RuntimeError("TEXTBEE_API_KEY is missing from .env")

    phone = normalize_phone(receiver_phone)
    print(f"Sending SMS to {phone}...")

    response = requests.post(
        "https://api.textbee.dev/api/v1/gateway/send-sms",
        json={"recipients": [phone], "message": message},
        headers={"x-api-key": TEXTBEE_API_KEY, "Content-Type": "application/json"},
        timeout=30
    )

    if response.status_code == 200:
        print("SMS sent successfully!")
        increment_today_sms_count()
        return True

    print("Textbee error:", response.text)
    return False


def queue_sms(receiver_phone: str, message: str, purpose: str = "general"):
    sms_queue.insert_one({
        "phone": normalize_phone(receiver_phone),
        "message": message,
        "purpose": purpose,
        "status": "pending",
        "createdAt": datetime.now(timezone.utc),
        "attempts": 0
    })
    print(f"SMS queued for {receiver_phone}")


def send_sms(receiver_phone: str, message: str, purpose: str = "general"):
    current_count = get_today_sms_count()
    if current_count >= 50:
        print(f"Daily limit reached ({current_count}/50). Queuing SMS...")
        queue_sms(receiver_phone, message, purpose)
        return False

    success = send_sms_direct(receiver_phone, message)
    if not success:
        queue_sms(receiver_phone, message, purpose)
        return False
    return True


def process_sms_queue(limit: int = 10):
    current_count = get_today_sms_count()
    remaining = 50 - current_count
    if remaining <= 0:
        return {"processed": 0, "remaining_limit": 0}

    pending = list(sms_queue.find({"status": "pending"}).sort("createdAt", 1).limit(min(limit, remaining)))
    processed = 0

    for item in pending:
        success = send_sms_direct(item["phone"], item["message"])
        if success:
            sms_queue.update_one(
                {"_id": item["_id"]},
                {"$set": {"status": "sent", "sentAt": datetime.now(timezone.utc)}}
            )
            processed += 1
        else:
            sms_queue.update_one({"_id": item["_id"]}, {"$inc": {"attempts": 1}})

    return {"processed": processed, "remaining_limit": 50 - get_today_sms_count()}


def send_initial_sms(receiver_phone: str, name: str):
    send_sms(
        receiver_phone,
        f"""Hello {name},

Thank you for applying to join the CREST Community!

We have successfully received your application.
Our team will carefully review all submissions and notify you of the outcome.

Best regards,
CREST Community""",
        purpose="application_received"
    )


def generate_password():
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(8))


def send_shortlisted_sms(receiver_phone: str, name: str, login_password: str, email: str):
    send_sms(
        receiver_phone,
        f"""Hello {name},

Congratulations! You have been selected to join the CREST Community.

Your login credentials:
Email: {email}
Password: {login_password}

Please log in to your CREST dashboard.

Welcome to CREST!
CREST Community""",
        purpose="shortlisted"
    )


def send_rejected_sms(receiver_phone: str, name: str):
    send_sms(
        receiver_phone,
        f"""Hello {name},

Thank you for your interest in joining the CREST Community.

After careful review, we regret to inform you that your application has not been selected at this time.

We encourage you to apply again in future cycles.

Best regards,
CREST Community""",
        purpose="rejected"
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():
    return {"message": "CREST FastAPI server is running"}


# =========================================================
# SMS ADMIN ENDPOINTS
# =========================================================

@app.post("/admin/sms/process-queue")
async def process_queue(current_user=Depends(require_admin)):
    result = process_sms_queue(limit=20)
    return {
        "success": True,
        "message": f"Processed {result['processed']} SMS",
        "remaining_today": result["remaining_limit"]
    }


@app.get("/admin/sms/status")
async def sms_status(current_user=Depends(require_admin)):
    today_count = get_today_sms_count()
    pending_count = sms_queue.count_documents({"status": "pending"})
    return {
        "success": True,
        "sent_today": today_count,
        "remaining_today": max(0, 50 - today_count),
        "pending_in_queue": pending_count
    }


# =========================================================
# APPLICATIONS
# =========================================================

@app.post("/applications")
async def add_application(application: Application):
    data = application.model_dump()
    data["createdAt"] = datetime.now(timezone.utc)
    data["status"] = "new"
    result = new_applications.insert_one(data)

    try:
        send_initial_sms(application.phone, application.name)
    except Exception as e:
        print("Failed to send/queue initial SMS:", e)

    return {
        "message": "Application received",
        "name": application.name,
        "id": str(result.inserted_id)
    }


def load_collection(collection, status):
    applications = []
    for application in collection.find():
        application["id"] = str(application["_id"])
        del application["_id"]
        application.pop("password", None)
        application.pop("password_hash", None)
        application["status"] = status
        applications.append(application)
    return applications


@app.get("/loadata")
async def load_data(current_user=Depends(require_admin)):
    return load_collection(new_applications, "new")


@app.get("/loadshortlisted")
async def load_shortlisted(current_user=Depends(require_admin)):
    return load_collection(shortlisted, "shortlisted")


@app.get("/loadrejected")
async def load_rejected(current_user=Depends(require_admin)):
    return load_collection(rejected, "rejected")


def get_id(application_id):
    try:
        return ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")


def move_application(application_id, destination, status):
    object_id = get_id(application_id)
    application = new_applications.find_one({"_id": object_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    email = application["email"].strip().lower()
    name = application["name"]
    phone = application.get("phone", "")

    del application["_id"]
    application["status"] = status

    if status == "shortlisted":
        login_password = generate_password()
        password_hash = hash_password(login_password)
        shortlisted_at = datetime.now(timezone.utc)

        application["shortlistedAt"] = shortlisted_at
        application.pop("password", None)
        application.pop("password_hash", None)
        destination.insert_one(application)

        member = {
            "name": application.get("name"),
            "email": email,
            "phone": application.get("phone"),
            "regNo": application.get("regNo"),
            "branch": application.get("branch"),
            "year": application.get("year"),
            "wing": application.get("wing"),
            "skills": application.get("skills"),
            "why": application.get("why"),
            "portfolio": application.get("portfolio"),
            "password_hash": password_hash,
            "Attendance": "100",
            "createdAt": shortlisted_at,
            "status": "active"
        }

        members.update_one({"email": email}, {"$set": member}, upsert=True)
        new_applications.delete_one({"_id": object_id})

        try:
            send_shortlisted_sms(phone, name, login_password, email)
        except Exception as e:
            print("Failed to send/queue shortlisted SMS:", e)

        return {"message": "Application shortlisted successfully", "id": str(object_id)}

    if status == "rejected":
        application["rejectedAt"] = datetime.now(timezone.utc)
        destination.insert_one(application)
        new_applications.delete_one({"_id": object_id})

        try:
            send_rejected_sms(phone, name)
        except Exception as e:
            print("Failed to send/queue rejected SMS:", e)

        return {"message": "Application rejected successfully", "id": str(object_id)}

    raise HTTPException(status_code=400, detail="Invalid application status")


@app.post("/shortlist/{application_id}")
async def shortlist_application(application_id: str, current_user=Depends(require_admin)):
    return move_application(application_id, shortlisted, "shortlisted")


@app.post("/reject/{application_id}")
async def reject_application(application_id: str, current_user=Depends(require_admin)):
    return move_application(application_id, rejected, "rejected")


# =========================================================
# LOGIN
# =========================================================

@app.post("/logincheck")
async def login(login: LoginData):
    email = login.email.strip().lower()
    password = login.password

    admin = admins.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
    if admin:
        valid_admin = False
        if admin.get("password_hash"):
            valid_admin = verify_password(password, admin["password_hash"])

        if not valid_admin and (admin.get("password") or admin.get("password_hash")):
            if admin.get("password") == password or admin.get("password_hash") == password:
                valid_admin = True
                admins.update_one(
                    {"_id": admin["_id"]},
                    {"$set": {"password_hash": hash_password(password)}, "$unset": {"password": ""}}
                )

        if not valid_admin:
            return {"success": False, "role": "admin", "message": "Incorrect password"}

        token = create_access_token(email, "admin")
        return {
            "success": True,
            "role": "admin",
            "message": "Admin login successful",
            "name": admin.get("name", "Administrator"),
            "email": email,
            "token": token
        }

    user = members.find_one({
        "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"},
        "status": {"$ne": "disabled"}
    })

    if not user:
        old_user = shortlisted.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
        if old_user:
            old_password = old_user.get("password") or old_user.get("password_hash")
            if old_password:
                user = {
                    "name": old_user.get("name"),
                    "email": email,
                    "phone": old_user.get("phone"),
                    "regNo": old_user.get("regNo"),
                    "branch": old_user.get("branch"),
                    "year": old_user.get("year"),
                    "wing": old_user.get("wing"),
                    "skills": old_user.get("skills"),
                    "why": old_user.get("why"),
                    "portfolio": old_user.get("portfolio"),
                    "password_hash": hash_password(old_password) if not str(old_password).startswith("$2") else old_password,
                    "Attendance": "100",
                    "createdAt": old_user.get("shortlistedAt", datetime.now(timezone.utc)),
                    "status": "active"
                }
                members.insert_one(user)
                shortlisted.update_one({"_id": old_user["_id"]}, {"$unset": {"password": ""}})

    if not user:
        return {"success": False, "role": "none", "message": "User not registered"}

    stored_hash = user.get("password_hash") or user.get("password")
    if not stored_hash:
        return {"success": False, "role": "member", "message": "Member password is not configured"}

    valid_member = verify_password(password, stored_hash)
    if not valid_member:
        if (user.get("password") and user.get("password") == password) or \
           (user.get("password_hash") and user.get("password_hash") == password):
            valid_member = True

    if not valid_member:
        return {"success": False, "role": "member", "message": "Incorrect password"}

    if user.get("password") or (user.get("password_hash") and user.get("password_hash") == password):
        members.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_hash": hash_password(password)}, "$unset": {"password": ""}}
        )

    token = create_access_token(user["email"], "member")
    return {
        "success": True,
        "role": "member",
        "message": "Login successful",
        "name": user.get("name", "Member"),
        "email": user["email"],
        "wing": user.get("wing", ""),
        "token": token
    }


@app.post("/admin/verify")
async def verify_admin(current_user=Depends(require_admin)):
    admin = admins.find_one({"email": current_user["email"]})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin account not found")
    return {"success": True, "role": "admin", "email": admin["email"]}


@app.post("/member/verify")
async def verify_member(current_user=Depends(require_member)):
    member = members.find_one({"email": current_user["email"], "status": "active"})
    if not member:
        raise HTTPException(status_code=401, detail="Member account not found or disabled")
    return {
        "success": True,
        "role": "member",
        "email": member["email"],
        "name": member.get("name", "Member")
    }


@app.get("/member/me")
async def get_member_data(current_user=Depends(require_member)):
    member = members.find_one({"email": current_user["email"], "status": "active"})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member["id"] = str(member["_id"])
    del member["_id"]
    member.pop("password_hash", None)
    member.pop("password", None)
    return {"success": True, "member": member}


@app.post("/member/disable/{email}")
async def disable_member(email: str, current_user=Depends(require_admin)):
    result = members.update_one(
        {"email": email.strip().lower()},
        {"$set": {"status": "disabled"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"success": True, "message": "Member disabled successfully"}


@app.post("/member/change-password")
async def change_password(payload: ChangePasswordData, current_user=Depends(require_member)):
    member = members.find_one({"email": current_user["email"], "status": "active"})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if not member.get("password_hash"):
        raise HTTPException(status_code=400, detail="Member password is not configured")

    if not verify_password(payload.current_password, member["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="New password must be different from the current password")

    new_hash = hash_password(payload.new_password)
    members.update_one({"_id": member["_id"]}, {"$set": {"password_hash": new_hash}})

    new_token = create_access_token(member["email"], "member")
    return {
        "success": True,
        "message": "Password updated successfully",
        "accessToken": new_token
    }


# =========================================================
# POLLS
# =========================================================

def serialize_poll(poll, viewer_email: Optional[str] = None):
    created_at = poll.get("createdAt")
    result = {
        "id": str(poll["_id"]),
        "question": poll.get("question", ""),
        "options": poll.get("options", []),
        "active": poll.get("active", True),
        "createdAt": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
    }
    voters = poll.get("voters", {})
    if viewer_email is not None:
        result["myVote"] = voters.get(viewer_email)
    return result


@app.post("/admin/polls")
async def create_poll(payload: PollCreate, current_user=Depends(require_admin)):
    question = payload.question.strip()
    cleaned_options = [o.strip() for o in payload.options if o.strip()]

    if not question:
        raise HTTPException(status_code=400, detail="Poll question is required")
    if len(cleaned_options) < 2:
        raise HTTPException(status_code=400, detail="At least two options are required")

    doc = {
        "question": question,
        "options": [{"text": o, "votes": 0} for o in cleaned_options],
        "active": True,
        "createdAt": datetime.now(timezone.utc),
        "voters": {},
    }
    result = polls.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "poll": serialize_poll(doc)}


@app.get("/polls")
async def list_polls(current_user=Depends(get_current_user)):
    all_polls = list(polls.find().sort("createdAt", -1))
    return [serialize_poll(p, current_user["email"]) for p in all_polls]


@app.post("/polls/{poll_id}/vote")
async def vote_poll(poll_id: str, payload: PollVote, current_user=Depends(require_member)):
    object_id = get_id(poll_id)
    poll = polls.find_one({"_id": object_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if not poll.get("active", True):
        raise HTTPException(status_code=400, detail="This poll is closed")

    email = current_user["email"]
    voters = poll.get("voters", {})
    if email in voters:
        raise HTTPException(status_code=400, detail="You have already voted on this poll")

    option_texts = [o["text"] for o in poll.get("options", [])]
    if payload.option not in option_texts:
        raise HTTPException(status_code=400, detail="Invalid option")

    polls.update_one(
        {"_id": object_id, "options.text": payload.option},
        {"$inc": {"options.$.votes": 1}, "$set": {f"voters.{email}": payload.option}},
    )
    updated = polls.find_one({"_id": object_id})
    return {"success": True, "poll": serialize_poll(updated, email)}


@app.post("/admin/polls/{poll_id}/toggle")
async def toggle_poll(poll_id: str, current_user=Depends(require_admin)):
    object_id = get_id(poll_id)
    poll = polls.find_one({"_id": object_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    new_state = not poll.get("active", True)
    polls.update_one({"_id": object_id}, {"$set": {"active": new_state}})
    return {"success": True, "active": new_state}


@app.delete("/admin/polls/{poll_id}")
async def delete_poll(poll_id: str, current_user=Depends(require_admin)):
    object_id = get_id(poll_id)
    result = polls.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Poll not found")
    return {"success": True}


# =========================================================
# NOTIFICATIONS
# =========================================================

def serialize_notification(notice):
    sent_at = notice.get("sentAt")
    return {
        "id": str(notice["_id"]),
        "msg": notice.get("msg", ""),
        "audience": notice.get("audience", "All members"),
        "sentAt": sent_at.isoformat() if isinstance(sent_at, datetime) else sent_at,
    }


@app.post("/admin/notify")
async def send_notification(payload: notifyt, current_user=Depends(require_admin)):
    message = payload.msg.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    doc = {
        "msg": message,
        "audience": payload.audience or "All members",
        "sentAt": datetime.now(timezone.utc),
    }
    result = notifica.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "notification": serialize_notification(doc)}


@app.get("/admin/notify")
async def list_notifications(current_user=Depends(require_admin)):
    docs = list(notifica.find().sort("sentAt", -1).limit(50))
    return [serialize_notification(d) for d in docs]


@app.get("/member/notifications")
async def get_member_notifications(current_user=Depends(require_member)):
    docs = list(notifica.find().sort("sentAt", -1).limit(20))
    return {
        "success": True,
        "notifications": [serialize_notification(d) for d in docs]
    }


# =========================================================
# GROWTH MODULE
# =========================================================

def iso_or_none(value):
    return value.isoformat() if isinstance(value, datetime) else value


def serialize_growth_event(doc, viewer_email: Optional[str] = None):
    registrations = []
    for team in doc.get("registrations", []):
        registrations.append({
            "id": str(team.get("id", "")),
            "team": team.get("team", ""),
            "leader": team.get("leader", ""),
            "leaderEmail": team.get("leaderEmail", ""),
            "email": team.get("leaderEmail", ""),
            "members": ", ".join(
                m.get("name", "") if isinstance(m, dict) else str(m)
                for m in team.get("members", [])
            ),
            "memberEmails": team.get("memberEmails", []),
            "memberList": team.get("members", []),
            "submitted": iso_or_none(team.get("submitted")),
            "status": team.get("status", "registered"),
        })

    my_registration = None
    for team in registrations:
        if viewer_email and (viewer_email == team["leaderEmail"] or viewer_email in team["memberEmails"]):
            my_registration = team["id"]
            break

    return {
        "id": str(doc["_id"]),
        "kind": doc.get("kind", "workshop"),
        "category": doc.get("category", doc.get("kind", "workshop")),
        "title": doc.get("title", ""),
        "name": doc.get("title", ""),
        "instructions": doc.get("instructions", ""),
        "minTeam": int(doc.get("minTeam", 1)),
        "maxTeam": int(doc.get("maxTeam", 1)),
        "lastDate": doc.get("lastDate", ""),
        "date": doc.get("lastDate", ""),
        "status": doc.get("status", "Upcoming"),
        "question": doc.get("question"),
        "registrations": registrations,
        "winnerEmail": doc.get("winnerEmail"),
        "winnerName": doc.get("winnerName"),
        "winnerStatus": doc.get("winnerStatus"),
        "myRegistration": my_registration,
        "createdAt": iso_or_none(doc.get("createdAt")),
        "updatedAt": iso_or_none(doc.get("updatedAt")),
    }


def serialize_learning(doc):
    return {
        "id": str(doc["_id"]),
        "type": doc.get("type", "course"),
        "title": doc.get("title", ""),
        "name": doc.get("title", ""),
        "skill": doc.get("skill", ""),
        "track": doc.get("track", ""),
        "detail": doc.get("detail", ""),
        "level": doc.get("level", "Beginner"),
        "duration": doc.get("duration", ""),
        "mentor": doc.get("mentor", ""),
        "link": doc.get("link", ""),
        "progress": int(doc.get("progress", 0)),
        "steps": doc.get("steps", []),
        "createdAt": iso_or_none(doc.get("createdAt")),
    }


def serialize_assignment(doc, member_email: Optional[str] = None):
    submission = None
    if member_email:
        submission = growth_assignment_submissions.find_one({
            "assignmentId": doc["_id"],
            "memberEmail": member_email,
        })

    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "name": doc.get("title", ""),
        "description": doc.get("description", ""),
        "wing": doc.get("wing", ""),
        "link": doc.get("link", ""),
        "dueDate": doc.get("dueDate", ""),
        "createdAt": iso_or_none(doc.get("createdAt")),
        "completion": {
            "status": submission.get("status") if submission else "pending",
            "answer": submission.get("answer", "") if submission else "",
            "submittedAt": iso_or_none(submission.get("submittedAt")) if submission else None,
        },
    }


def serialize_achievement(doc):
    return {
        "id": str(doc["_id"]),
        "memberEmail": doc.get("memberEmail", ""),
        "name": doc.get("name", ""),
        "year": doc.get("year", ""),
        "eventId": str(doc.get("eventId")) if doc.get("eventId") else None,
        "status": doc.get("status", ""),
        "createdAt": iso_or_none(doc.get("createdAt")),
    }


@app.get("/growth/members")
async def growth_members(query: str = "", current_user=Depends(require_member)):
    q = query.strip().lower()
    docs = list(members.find(
        {"status": "active"},
        {"_id": 1, "name": 1, "email": 1, "wing": 1, "skills": 1}
    ).sort("name", 1).limit(100))

    result = []
    for member in docs:
        skills_value = member.get("skills", "")
        skills = [s.strip() for s in skills_value.split(",") if s.strip()] if isinstance(skills_value, str) else skills_value or []
        haystack = " ".join([
            str(member.get("name", "")),
            str(member.get("email", "")),
            str(member.get("wing", "")),
            " ".join(skills),
        ]).lower()

        if q and q not in haystack:
            continue

        result.append({
            "id": str(member["_id"]),
            "name": member.get("name", "Member"),
            "email": member.get("email", ""),
            "wing": member.get("wing", ""),
            "skills": skills,
        })
    return result


@app.get("/growth/events")
async def list_growth_events(current_user=Depends(require_member)):
    docs = list(growth_events.find().sort("createdAt", -1))
    return [serialize_growth_event(doc, current_user["email"]) for doc in docs]


@app.get("/admin/growth/events")
async def list_admin_growth_events(current_user=Depends(require_admin)):
    docs = list(growth_events.find().sort("createdAt", -1))
    return [serialize_growth_event(doc) for doc in docs]


def event_is_ongoing(event):
    return str(event.get("status", "")).strip().lower() == "ongoing"


@app.post("/admin/growth/events")
async def create_growth_event(payload: GrowthEventCreate, current_user=Depends(require_admin)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Event title is required")
    if payload.minTeam < 1 or payload.maxTeam < payload.minTeam:
        raise HTTPException(status_code=400, detail="Invalid team size")
    if payload.kind not in {"workshop", "event"}:
        raise HTTPException(status_code=400, detail="Invalid event type")
    if payload.category not in {"workshop", "technical", "non-technical"}:
        raise HTTPException(status_code=400, detail="Invalid event category")

    question = payload.question
    if payload.kind == "workshop" and question:
        question = {
            "title": str(question.get("title", "")).strip(),
            "prompt": str(question.get("prompt", "")).strip(),
            "starter": str(question.get("starter", "")),
            "expectedOutput": str(question.get("expectedOutput", "")),
        }

    doc = {
        "kind": payload.kind,
        "category": payload.category,
        "title": title,
        "instructions": payload.instructions.strip(),
        "minTeam": payload.minTeam,
        "maxTeam": payload.maxTeam,
        "lastDate": payload.lastDate.strip(),
        "status": payload.status.strip() or "Upcoming",
        "question": question,
        "registrations": [],
        "winnerEmail": None,
        "winnerName": None,
        "winnerStatus": None,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = growth_events.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "event": serialize_growth_event(doc)}


@app.put("/admin/growth/events/{event_id}")
async def update_growth_event(event_id: str, payload: GrowthEventUpdate, current_user=Depends(require_admin)):
    object_id = get_id(event_id)
    existing = growth_events.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")

    updates = {}
    data = payload.model_dump(exclude_unset=True)

    if "title" in data:
        title = str(data["title"]).strip()
        if not title:
            raise HTTPException(status_code=400, detail="Event title is required")
        updates["title"] = title
    if "kind" in data:
        if data["kind"] not in {"workshop", "event"}:
            raise HTTPException(status_code=400, detail="Invalid event type")
        updates["kind"] = data["kind"]
    if "category" in data:
        if data["category"] not in {"workshop", "technical", "non-technical"}:
            raise HTTPException(status_code=400, detail="Invalid event category")
        updates["category"] = data["category"]
    for field in ("instructions", "lastDate", "status"):
        if field in data:
            updates[field] = str(data[field] or "").strip()
    if "minTeam" in data or "maxTeam" in data:
        min_team = int(data.get("minTeam", existing.get("minTeam", 1)))
        max_team = int(data.get("maxTeam", existing.get("maxTeam", 1)))
        if min_team < 1 or max_team < min_team:
            raise HTTPException(status_code=400, detail="Invalid team size")
        updates["minTeam"] = min_team
        updates["maxTeam"] = max_team
    if "question" in data:
        q = data["question"]
        updates["question"] = None if q is None else {
            "title": str(q.get("title", "")).strip(),
            "prompt": str(q.get("prompt", "")).strip(),
            "starter": str(q.get("starter", "")),
            "expectedOutput": str(q.get("expectedOutput", "")),
        }

    updates["updatedAt"] = datetime.now(timezone.utc)
    growth_events.update_one({"_id": object_id}, {"$set": updates})
    updated = growth_events.find_one({"_id": object_id})
    return {"success": True, "event": serialize_growth_event(updated)}


@app.delete("/admin/growth/events/{event_id}")
async def delete_growth_event(event_id: str, current_user=Depends(require_admin)):
    object_id = get_id(event_id)
    result = growth_events.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True}


@app.post("/growth/events/{event_id}/teams")
async def create_growth_team(event_id: str, payload: GrowthTeamCreate, current_user=Depends(require_member)):
    object_id = get_id(event_id)
    event = growth_events.find_one({"_id": object_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event_is_ongoing(event):
        raise HTTPException(status_code=403, detail="This event is not open. Admin must mark it Ongoing first.")

    team_name = payload.team.strip()
    if not team_name:
        raise HTTPException(status_code=400, detail="Team name is required")

    leader_email = current_user["email"].strip().lower()
    requested_emails = [e.strip().lower() for e in payload.memberEmails if e.strip()]
    emails = list(dict.fromkeys([leader_email, *requested_emails]))

    if len(emails) < event.get("minTeam", 1):
        raise HTTPException(status_code=400, detail="Minimum team size not reached")
    if len(emails) > event.get("maxTeam", 1):
        raise HTTPException(status_code=400, detail="Maximum team size exceeded")

    existing_registrations = event.get("registrations", [])
    for registration in existing_registrations:
        if registration.get("team", "").lower() == team_name.lower():
            raise HTTPException(status_code=409, detail="Team name already exists")
        registered_emails = set(registration.get("memberEmails", []))
        if registered_emails.intersection(emails):
            raise HTTPException(status_code=409, detail="A member is already registered in another team for this event")

    member_docs = list(members.find({"email": {"$in": emails}, "status": "active"}))
    found = {m["email"].lower(): m for m in member_docs}
    missing = [email for email in emails if email not in found]
    if missing:
        raise HTTPException(status_code=400, detail=f"Member account not found: {missing[0]}")

    member_list = [
        {"email": email, "name": found[email].get("name", "Member"), "wing": found[email].get("wing", "")}
        for email in emails
    ]

    registration = {
        "id": uuid4().hex,
        "team": team_name,
        "leader": found[leader_email].get("name", "Member"),
        "leaderEmail": leader_email,
        "memberEmails": emails,
        "members": member_list,
        "submitted": datetime.now(timezone.utc),
        "status": "registered",
    }

    growth_events.update_one(
        {"_id": object_id},
        {"$push": {"registrations": registration}, "$set": {"updatedAt": datetime.now(timezone.utc)}}
    )
    updated = growth_events.find_one({"_id": object_id})
    return {"success": True, "event": serialize_growth_event(updated, leader_email)}


@app.post("/growth/events/{event_id}/teams/{team_id}/join")
async def join_growth_team(event_id: str, team_id: str, current_user=Depends(require_member)):
    object_id = get_id(event_id)
    email = current_user["email"].strip().lower()
    event = growth_events.find_one({"_id": object_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event_is_ongoing(event):
        raise HTTPException(status_code=403, detail="This event is not open. Admin must mark it Ongoing first.")

    for team in event.get("registrations", []):
        if team.get("id") != team_id:
            continue
        if email in team.get("memberEmails", []):
            return {"success": True, "message": "Already in this team"}

        for other in event.get("registrations", []):
            if email in other.get("memberEmails", []):
                raise HTTPException(status_code=409, detail="You are already registered in another team for this event")

        if len(team.get("memberEmails", [])) >= event.get("maxTeam", 1):
            raise HTTPException(status_code=400, detail="Team is full")

        member = members.find_one({"email": email, "status": "active"})
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")

        growth_events.update_one(
            {"_id": object_id, "registrations.id": team_id},
            {
                "$push": {
                    "registrations.$.memberEmails": email,
                    "registrations.$.members": {
                        "email": email,
                        "name": member.get("name", "Member"),
                        "wing": member.get("wing", ""),
                    },
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)},
            },
        )
        return {"success": True}

    raise HTTPException(status_code=404, detail="Team not found")


@app.post("/admin/growth/events/{event_id}/winner")
async def choose_growth_event_winner(event_id: str, payload: GrowthAchievementCreate, current_user=Depends(require_admin)):
    object_id = get_id(event_id)
    event = growth_events.find_one({"_id": object_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    winner_email = payload.memberEmail.strip().lower()
    winner = members.find_one({"email": winner_email, "status": "active"})
    if not winner:
        raise HTTPException(status_code=404, detail="Winning member not found")

    registered = any(winner_email in team.get("memberEmails", []) for team in event.get("registrations", []))
    if not registered:
        raise HTTPException(status_code=400, detail="Winner must be a registered participant in this event")

    status = payload.status.strip() or "winner"
    growth_events.update_one(
        {"_id": object_id},
        {"$set": {
            "winnerEmail": winner_email,
            "winnerName": winner.get("name", "Member"),
            "winnerStatus": status,
            "updatedAt": datetime.now(timezone.utc),
        }}
    )
    members.update_one(
        {"_id": winner["_id"]},
        {"$set": {"applicantStatus": status, "lastEventWinAt": datetime.now(timezone.utc)}}
    )
    shortlisted.update_many({"email": winner_email}, {"$set": {"applicantStatus": status}})

    achievement = {
        "memberEmail": winner_email,
        "name": payload.name.strip() or event.get("title", "Event Winner"),
        "year": payload.year.strip() or str(datetime.now().year),
        "eventId": object_id,
        "status": status,
        "createdAt": datetime.now(timezone.utc),
    }
    achievement_result = growth_achievements.insert_one(achievement)
    achievement["_id"] = achievement_result.inserted_id

    updated_event = growth_events.find_one({"_id": object_id})
    return {
        "success": True,
        "event": serialize_growth_event(updated_event),
        "achievement": serialize_achievement(achievement),
        "member": {
            "email": winner_email,
            "name": winner.get("name", "Member"),
            "applicantStatus": status,
        },
    }


@app.get("/growth/learning")
async def list_growth_learning(current_user=Depends(require_member)):
    docs = list(growth_learning.find().sort("createdAt", -1))
    return [serialize_learning(doc) for doc in docs]


@app.get("/admin/growth/learning")
async def list_admin_growth_learning(current_user=Depends(require_admin)):
    docs = list(growth_learning.find().sort("createdAt", -1))
    return [serialize_learning(doc) for doc in docs]


@app.post("/admin/growth/learning")
async def create_growth_learning(payload: GrowthLearningCreate, current_user=Depends(require_admin)):
    learning_type = payload.type.strip().lower()
    if learning_type not in {"course", "roadmap"}:
        raise HTTPException(status_code=400, detail="Type must be course or roadmap")
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    doc = {
        "type": learning_type,
        "title": payload.title.strip(),
        "skill": payload.skill.strip(),
        "track": payload.track.strip() or payload.skill.strip(),
        "detail": payload.detail.strip(),
        "level": payload.level.strip() or "Beginner",
        "duration": payload.duration.strip(),
        "mentor": payload.mentor.strip(),
        "link": payload.link.strip(),
        "steps": [{"title": step.title.strip(), "link": step.link.strip(), "description": step.description.strip()} for step in payload.steps if step.title.strip()],
        "progress": 0,
        "createdAt": datetime.now(timezone.utc),
    }
    result = growth_learning.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "learning": serialize_learning(doc)}


@app.delete("/admin/growth/learning/{learning_id}")
async def delete_growth_learning(learning_id: str, current_user=Depends(require_admin)):
    object_id = get_id(learning_id)
    result = growth_learning.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Learning item not found")
    return {"success": True}


@app.get("/growth/assignments")
async def list_growth_assignments(current_user=Depends(require_member)):
    member = members.find_one({"email": current_user["email"], "status": "active"})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    wing = member.get("wing", "").strip()
    docs = list(growth_assignments.find({
        "$or": [{"wing": wing}, {"wing": "All members"}, {"wing": "all"}]
    }).sort("createdAt", -1))

    completed_ids = {
        row.get("assignmentId")
        for row in growth_assignment_submissions.find(
            {"memberEmail": current_user["email"], "status": "completed"},
            {"assignmentId": 1},
        )
        if row.get("assignmentId")
    }
    docs = [doc for doc in docs if doc["_id"] not in completed_ids]
    return [serialize_assignment(doc, current_user["email"]) for doc in docs]


@app.get("/admin/growth/assignments")
async def list_admin_growth_assignments(current_user=Depends(require_admin)):
    docs = list(growth_assignments.find().sort("createdAt", -1))
    return [serialize_assignment(doc) for doc in docs]


@app.post("/admin/growth/assignments")
async def create_growth_assignment(payload: GrowthAssignmentCreate, current_user=Depends(require_admin)):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Assignment title is required")
    if not payload.wing.strip():
        raise HTTPException(status_code=400, detail="Assignment wing is required")

    doc = {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "wing": payload.wing.strip(),
        "link": payload.link.strip(),
        "dueDate": payload.dueDate.strip(),
        "createdAt": datetime.now(timezone.utc),
    }
    result = growth_assignments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "assignment": serialize_assignment(doc)}


@app.delete("/admin/growth/assignments/{assignment_id}")
async def delete_growth_assignment(assignment_id: str, current_user=Depends(require_admin)):
    object_id = get_id(assignment_id)
    result = growth_assignments.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    growth_assignment_submissions.delete_many({"assignmentId": object_id})
    return {"success": True}


@app.post("/growth/assignments/{assignment_id}/submit")
async def submit_growth_assignment(assignment_id: str, payload: GrowthAssignmentSubmit, current_user=Depends(require_member)):
    object_id = get_id(assignment_id)
    assignment = growth_assignments.find_one({"_id": object_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    member = members.find_one({"email": current_user["email"], "status": "active"})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    wing = member.get("wing", "").strip()
    if assignment.get("wing") not in {wing, "All members", "all"}:
        raise HTTPException(status_code=403, detail="Assignment is not for your wing")

    submission = {
        "assignmentId": object_id,
        "memberEmail": current_user["email"],
        "answer": payload.answer.strip(),
        "status": "completed",
        "submittedAt": datetime.now(timezone.utc),
    }
    growth_assignment_submissions.update_one(
        {"assignmentId": object_id, "memberEmail": current_user["email"]},
        {"$set": submission},
        upsert=True,
    )
    return {
        "success": True,
        "assignment": serialize_assignment(assignment, current_user["email"]),
    }


@app.get("/growth/achievements")
async def list_growth_achievements(current_user=Depends(require_member)):
    docs = list(growth_achievements.find({"memberEmail": current_user["email"]}).sort("createdAt", -1))
    return [serialize_achievement(doc) for doc in docs]


@app.post("/admin/growth/achievements")
async def create_growth_achievement(payload: GrowthAchievementCreate, current_user=Depends(require_admin)):
    email = payload.memberEmail.strip().lower()
    member = members.find_one({"email": email, "status": "active"})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    doc = {
        "memberEmail": email,
        "name": payload.name.strip(),
        "year": payload.year.strip(),
        "eventId": get_id(payload.eventId) if payload.eventId else None,
        "status": payload.status.strip() or "verified",
        "createdAt": datetime.now(timezone.utc),
    }
    if not doc["name"]:
        raise HTTPException(status_code=400, detail="Achievement name is required")

    result = growth_achievements.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "achievement": serialize_achievement(doc)}

@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "alive"}    