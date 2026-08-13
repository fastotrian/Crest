from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from urllib.parse import quote_plus

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from uuid import uuid4

from jose import jwt, JWTError
from passlib.context import CryptContext

import random
import string
import os
import re
import requests          # <-- added

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
    "@cluster0.jcwhpzw.mongodb.net/"
    "?appName=Cluster0"
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

# Growth module collections
growth_events = db["growth_events"]
growth_learning = db["growth_learning"]
growth_assignments = db["growth_assignments"]
growth_assignment_submissions = db["growth_assignment_submissions"]
growth_achievements = db["growth_achievements"]


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="CREST API",
    version="1.0.0"
)


# =========================================================
# JWT SECURITY
# =========================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# PASSWORD HASHING
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password cannot be empty")

    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer when using bcrypt.")

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False

    if plain_password == hashed_password:
        return True

    try:
        if len(plain_password.encode("utf-8")) > 72:
            return False
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as error:
        print("Password verification error:", error)
        return False


# =========================================================
# HTTP BEARER
# =========================================================

security = HTTPBearer()


# =========================================================
# CREATE JWT
# =========================================================

def create_access_token(email: str, role: str) -> str:
    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": email,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# =========================================================
# READ JWT
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
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


# =========================================================
# REQUIRE ADMIN / MEMBER
# =========================================================

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

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

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
# MODELS  (unchanged)
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


# Growth models stay exactly the same...
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
# SMS  (Textbee)
# =========================================================

def normalize_phone(phone: str) -> str:
    """Make sure phone is in E.164 format (best effort for Indian numbers)."""
    phone = re.sub(r"[^\d+]", "", phone.strip())
    if phone.startswith("+"):
        return phone
    if phone.startswith("91") and len(phone) == 12:
        return "+" + phone
    if len(phone) == 10:          # common Indian mobile
        return "+91" + phone
    return phone                  # fallback – hope it's already correct


def send_sms(receiver_phone: str, message: str):
    if not TEXTBEE_API_KEY:
        raise RuntimeError("TEXTBEE_API_KEY is missing from .env")

    phone = normalize_phone(receiver_phone)

    print(f"Sending SMS to {phone}...")

    response = requests.post(
        "https://api.textbee.dev/api/v1/gateway/send-sms",
        json={
            "recipients": [phone],
            "message": message
        },
        headers={
            "x-api-key": TEXTBEE_API_KEY,
            "Content-Type": "application/json"
        },
        timeout=30
    )

    if response.status_code != 200:
        print("Textbee error:", response.text)
        raise RuntimeError(f"Failed to send SMS: {response.text}")

    print("SMS sent successfully!")
    return response.json()


# =========================================================
# APPLICATION RECEIVED SMS
# =========================================================

def send_initial_sms(receiver_phone: str, name: str):
    send_sms(
        receiver_phone,
        f"""Hello {name},

Thank you for applying to join the CREST Community!

We have successfully received your application.

Our team will carefully review all submissions and notify you of the outcome.

Best regards,
CREST Community"""
    )


# =========================================================
# GENERATE MEMBER PASSWORD
# =========================================================

def generate_password():
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(8))


# =========================================================
# SHORTLIST SMS
# =========================================================

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
CREST Community"""
    )


# =========================================================
# REJECTED SMS
# =========================================================

def send_rejected_sms(receiver_phone: str, name: str):
    send_sms(
        receiver_phone,
        f"""Hello {name},

Thank you for your interest in joining the CREST Community.

After careful review, we regret to inform you that your application has not been selected at this time.

We encourage you to apply again in future cycles.

Best regards,
CREST Community"""
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():
    return {"message": "CREST FastAPI server is running"}


# =========================================================
# ADD APPLICATION
# =========================================================

@app.post("/applications")
async def add_application(application: Application):
    data = application.model_dump()
    data["createdAt"] = datetime.now(timezone.utc)
    data["status"] = "new"

    result = new_applications.insert_one(data)

    # Send SMS instead of email
    try:
        send_initial_sms(application.phone, application.name)
    except Exception as e:
        print("Failed to send initial SMS:", e)

    return {
        "message": "Application received",
        "name": application.name,
        "id": str(result.inserted_id)
    }


# =========================================================
# LOAD COLLECTION  (unchanged)
# =========================================================

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


# =========================================================
# MOVE APPLICATION  (SMS instead of email)
# =========================================================

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

    # ========== SHORTLIST ==========
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

        # Send credentials via SMS
        try:
            send_shortlisted_sms(phone, name, login_password, email)
        except Exception as e:
            print("Failed to send shortlisted SMS:", e)

        return {
            "message": "Application shortlisted successfully",
            "id": str(object_id)
        }

    # ========== REJECT ==========
    if status == "rejected":
        application["rejectedAt"] = datetime.now(timezone.utc)
        destination.insert_one(application)
        new_applications.delete_one({"_id": object_id})

        try:
            send_rejected_sms(phone, name)
        except Exception as e:
            print("Failed to send rejected SMS:", e)

        return {
            "message": "Application rejected successfully",
            "id": str(object_id)
        }

    raise HTTPException(status_code=400, detail="Invalid application status")


@app.post("/shortlist/{application_id}")
async def shortlist_application(
    application_id: str,
    current_user=Depends(require_admin)
):
    return move_application(application_id, shortlisted, "shortlisted")


@app.post("/reject/{application_id}")
async def reject_application(
    application_id: str,
    current_user=Depends(require_admin)
):
    return move_application(application_id, rejected, "rejected")

# =========================================================
# LOGIN
# =========================================================

@app.post("/logincheck")
async def login(login: LoginData):

    email = login.email.strip().lower()
    password = login.password

    # =====================================================
    # ADMIN LOGIN
    # =====================================================

    admin = admins.find_one(
        {
            "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
        }
    )

    if admin:

        valid_admin = False

        if admin.get("password_hash"):
            valid_admin = verify_password(password, admin["password_hash"])

        if not valid_admin and (admin.get("password") or admin.get("password_hash")):
            if admin.get("password") == password or admin.get("password_hash") == password:
                valid_admin = True
                admins.update_one(
                    {"_id": admin["_id"]},
                    {
                        "$set": {"password_hash": hash_password(password)},
                        "$unset": {"password": ""}
                    }
                )

        if not valid_admin:
            return {
                "success": False,
                "role": "admin",
                "message": "Incorrect password"
            }

        token = create_access_token(email, "admin")

        return {
            "success": True,
            "role": "admin",
            "message": "Admin login successful",
            "name": admin.get("name", "Administrator"),
            "email": email,
            "token": token
        }

    # =====================================================
    # MEMBER LOGIN
    # =====================================================

    user = members.find_one(
        {
            "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"},
            "status": {"$ne": "disabled"}
        }
    )

    # Migrate old shortlisted member if needed
    if not user:
        old_user = shortlisted.find_one(
            {
                "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
            }
        )

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
                shortlisted.update_one(
                    {"_id": old_user["_id"]},
                    {"$unset": {"password": ""}}
                )

    if not user:
        return {
            "success": False,
            "role": "none",
            "message": "User not registered"
        }

    stored_hash = user.get("password_hash") or user.get("password")

    if not stored_hash:
        return {
            "success": False,
            "role": "member",
            "message": "Member password is not configured"
        }

    valid_member = verify_password(password, stored_hash)

    if not valid_member:
        if (user.get("password") and user.get("password") == password) or \
           (user.get("password_hash") and user.get("password_hash") == password):
            valid_member = True

    if not valid_member:
        return {
            "success": False,
            "role": "member",
            "message": "Incorrect password"
        }

    # Auto migrate plaintext → hash
    if user.get("password") or (user.get("password_hash") and user.get("password_hash") == password):
        members.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password_hash": hash_password(password)},
                "$unset": {"password": ""}
            }
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


# =========================================================
# VERIFY ADMIN
# =========================================================

@app.post("/admin/verify")
async def verify_admin(current_user=Depends(require_admin)):

    admin = admins.find_one({"email": current_user["email"]})

    if not admin:
        raise HTTPException(status_code=401, detail="Admin account not found")

    return {
        "success": True,
        "role": "admin",
        "email": admin["email"]
    }


# =========================================================
# VERIFY MEMBER
# =========================================================

@app.post("/member/verify")
async def verify_member(current_user=Depends(require_member)):

    member = members.find_one({
        "email": current_user["email"],
        "status": "active"
    })

    if not member:
        raise HTTPException(status_code=401, detail="Member account not found or disabled")

    return {
        "success": True,
        "role": "member",
        "email": member["email"],
        "name": member.get("name", "Member")
    }


# =========================================================
# GET CURRENT MEMBER DATA
# =========================================================

@app.get("/member/me")
async def get_member_data(current_user=Depends(require_member)):

    member = members.find_one({
        "email": current_user["email"],
        "status": "active"
    })

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member["id"] = str(member["_id"])
    del member["_id"]
    member.pop("password_hash", None)
    member.pop("password", None)

    return {
        "success": True,
        "member": member
    }


# =========================================================
# DISABLE MEMBER (Admin only)
# =========================================================

@app.post("/member/disable/{email}")
async def disable_member(email: str, current_user=Depends(require_admin)):

    result = members.update_one(
        {"email": email.strip().lower()},
        {"$set": {"status": "disabled"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")

    return {
        "success": True,
        "message": "Member disabled successfully"
    }


# =========================================================
# CHANGE MEMBER PASSWORD
# =========================================================

@app.post("/member/change-password")
async def change_password(
    payload: ChangePasswordData,
    current_user=Depends(require_member)
):

    member = members.find_one({
        "email": current_user["email"],
        "status": "active"
    })

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

    try:
        new_hash = hash_password(payload.new_password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    members.update_one(
        {"_id": member["_id"]},
        {"$set": {"password_hash": new_hash}}
    )

    new_token = create_access_token(member["email"], "member")

    return {
        "success": True,
        "message": "Password updated successfully",
        "accessToken": new_token
    }