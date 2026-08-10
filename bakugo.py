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
import bcrypt

import random
import string
import requests
import os
import re

from dotenv import load_dotenv


# =========================================================
# ENVIRONMENT
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


# =========================================================
# EMAIL SETTINGS
# =========================================================

SENDER_EMAIL = os.getenv("SENDER_EMAIL", "").strip()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()


# =========================================================
# MONGODB SETTINGS
# =========================================================

username = os.getenv("MONGO_USERNAME", "").strip()
password = os.getenv("MONGO_PASSWORD", "").strip()

if not username:
    raise RuntimeError(
        "MONGO_USERNAME is missing from .env"
    )

if not password:
    raise RuntimeError(
        "MONGO_PASSWORD is missing from .env"
    )


# URL encode username/password.
# This prevents MongoDB URI problems if the password
# contains special characters.

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
    raise RuntimeError(
        "JWT_SECRET_KEY is missing from .env"
    )


ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# PASSWORD HASHING
# =========================================================

def hash_password(password: str) -> str:

    if not password:
        raise ValueError(
            "Password cannot be empty"
        )

    # bcrypt has a 72-byte limit.
    # Your generated member passwords are only 8 characters,
    # so this normally won't matter.
    #
    # For admin passwords, reject passwords longer than 72 bytes
    # instead of silently truncating them.

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError(
            "Password must be 72 bytes or fewer when using bcrypt."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    if not plain_password or not hashed_password:
        return False

    if plain_password == hashed_password:
        return True

    try:

        plain_bytes = plain_password.encode("utf-8")

        if len(plain_bytes) > 72:
            return False

        return bcrypt.checkpw(
            plain_bytes,
            hashed_password.encode("utf-8")
        )

    except Exception as error:

        print(
            "Password verification error:",
            error
        )

        return False


# =========================================================
# HTTP BEARER
# =========================================================

security = HTTPBearer()


# =========================================================
# CREATE JWT
# =========================================================

def create_access_token(
    email: str,
    role: str
) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": email,
        "role": role,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# =========================================================
# READ JWT
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")
        role = payload.get("role")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        if not role:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        return {
            "email": email,
            "role": role
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# =========================================================
# REQUIRE ADMIN
# =========================================================

def require_admin(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


# =========================================================
# REQUIRE MEMBER
# =========================================================

def require_member(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "member":

        raise HTTPException(
            status_code=403,
            detail="Member access required"
        )

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


# =========================================================
# GROWTH MODULE MODELS
# =========================================================

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
# EMAIL
# =========================================================

def send_email(
    receiver,
    subject,
    message
):

    if not SENDER_EMAIL:
        raise RuntimeError(
            "SENDER_EMAIL is missing from .env"
        )

    if not RESEND_API_KEY:
        raise RuntimeError(
            "RESEND_API_KEY is missing from .env"
        )

    print(
        f"Sending email to {receiver}..."
    )

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": f"CREST Community <{SENDER_EMAIL}>",
            "to": [receiver],
            "subject": subject,
            "text": message,
        },
        timeout=15,
    )

    if response.status_code >= 400:

        print(
            "Resend API error:",
            response.status_code,
            response.text
        )

        raise RuntimeError(
            f"Failed to send email: {response.text}"
        )

    print("Email sent successfully!")


# =========================================================
# APPLICATION RECEIVED EMAIL
# =========================================================

def send_initial_email(
    receiver,
    name
):

    send_email(

        receiver,

        "CREST Community - Application Received",

        f"""Hello {name},

Thank you for applying to join the CREST Community!

We have successfully received your application.

Our team will carefully review all submissions.

Once the review process is complete, we will notify you of the outcome via email.

Thank you for taking the first step toward becoming part of our community!

Best regards,

CREST Community
"""
    )


# =========================================================
# GENERATE MEMBER PASSWORD
# =========================================================

def generate_password():

    characters = (
        string.ascii_letters
        + string.digits
    )

    return "".join(
        random.choice(characters)
        for _ in range(8)
    )


# =========================================================
# SHORTLIST EMAIL
# =========================================================

def send_shortlisted_email(
    receiver,
    name,
    login_password
):

    send_email(

        receiver,

        "CREST Community - Congratulations!",

        f"""Hello {name},

Congratulations!

We are delighted to inform you that you have been selected to join the CREST Community.

Your CREST login credentials are:

Email: {receiver}
Password: {login_password}

Please use these credentials to log in to your CREST dashboard.

Our team will contact you soon with onboarding details.

Welcome to the CREST Community!

Best regards,

CREST Community
"""
    )


# =========================================================
# REJECTED EMAIL
# =========================================================

def send_rejected_email(
    receiver,
    name
):

    send_email(

        receiver,

        "CREST Community - Application Update",

        f"""Hello {name},

Thank you for your interest in joining the CREST Community.

After carefully reviewing all submissions, we regret to inform you that your application has not been selected at this time.

We encourage you to continue pursuing your interests and apply again during future recruitment cycles.

We wish you all the best.

Best regards,

CREST Community
"""
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():

    return {
        "message": "CREST FastAPI server is running"
    }


# =========================================================
# ADD APPLICATION
# =========================================================

@app.post("/applications")
async def add_application(
    application: Application
):

    data = application.model_dump()

    data["createdAt"] = datetime.now(
        timezone.utc
    )

    data["status"] = "new"

    result = new_applications.insert_one(
        data
    )

    send_initial_email(
        application.email,
        application.name
    )

    return {

        "message": "Application received",

        "name": application.name,

        "id": str(
            result.inserted_id
        )
    }


# =========================================================
# LOAD COLLECTION
# =========================================================

def load_collection(
    collection,
    status
):

    applications = []

    for application in collection.find():

        application["id"] = str(
            application["_id"]
        )

        del application["_id"]

        # Never send password hashes
        # to frontend.

        application.pop(
            "password",
            None
        )

        application.pop(
            "password_hash",
            None
        )

        application["status"] = status

        applications.append(
            application
        )

    return applications


# =========================================================
# LOAD NEW APPLICATIONS
# ADMIN ONLY
# =========================================================

@app.get("/loadata")
async def load_data(
    current_user=Depends(require_admin)
):

    return load_collection(
        new_applications,
        "new"
    )


# =========================================================
# LOAD SHORTLISTED
# ADMIN ONLY
# =========================================================

@app.get("/loadshortlisted")
async def load_shortlisted(
    current_user=Depends(require_admin)
):

    return load_collection(
        shortlisted,
        "shortlisted"
    )


# =========================================================
# LOAD REJECTED
# ADMIN ONLY
# =========================================================

@app.get("/loadrejected")
async def load_rejected(
    current_user=Depends(require_admin)
):

    return load_collection(
        rejected,
        "rejected"
    )


# =========================================================
# OBJECT ID
# =========================================================

def get_id(
    application_id
):

    try:

        return ObjectId(
            application_id
        )

    except InvalidId:

        raise HTTPException(
            status_code=400,
            detail="Invalid application ID"
        )


# =========================================================
# MOVE APPLICATION
# =========================================================

def move_application(
    application_id,
    destination,
    status
):

    object_id = get_id(
        application_id
    )

    application = new_applications.find_one(
        {
            "_id": object_id
        }
    )

    if not application:

        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    email = application["email"].strip().lower()

    name = application["name"]

    # Remove MongoDB ID before inserting
    # into destination.

    del application["_id"]

    application["status"] = status


    # =====================================================
    # SHORTLIST
    # =====================================================

    if status == "shortlisted":

        login_password = generate_password()

        password_hash = hash_password(
            login_password
        )

        shortlisted_at = datetime.now(
            timezone.utc
        )

        application["shortlistedAt"] = (
            shortlisted_at
        )

        # Never store plaintext password
        # inside shortlisted collection.

        application.pop(
            "password",
            None
        )

        application.pop(
            "password_hash",
            None
        )

        # Store application in sorted.

        destination.insert_one(
            application
        )


        # =================================================
        # CREATE MEMBER
        # =================================================

        member = {

            "name": application.get(
                "name"
            ),

            "email": email,

            "phone": application.get(
                "phone"
            ),

            "regNo": application.get(
                "regNo"
            ),

            "branch": application.get(
                "branch"
            ),

            "year": application.get(
                "year"
            ),

            "wing": application.get(
                "wing"
            ),

            "skills": application.get(
                "skills"
            ),

            "why": application.get(
                "why"
            ),

            "portfolio": application.get(
                "portfolio"
            ),

            # ONLY HASHED PASSWORD
            "password_hash": password_hash,

            "Attendance": "100",

            "createdAt": shortlisted_at,

            "status": "active"
        }


        # Update existing member or create
        # new member.

        members.update_one(

            {
                "email": email
            },

            {
                "$set": member
            },

            upsert=True
        )


        # Remove application from new
        # collection.

        new_applications.delete_one(
            {
                "_id": object_id
            }
        )


        # Send credentials to member.

        send_shortlisted_email(
            email,
            name,
            login_password
        )


        return {

            "message":
                "Application shortlisted successfully",

            "id": str(
                object_id
            )
        }


    # =====================================================
    # REJECT
    # =====================================================

    if status == "rejected":

        application["rejectedAt"] = (
            datetime.now(
                timezone.utc
            )
        )

        destination.insert_one(
            application
        )

        new_applications.delete_one(
            {
                "_id": object_id
            }
        )

        send_rejected_email(
            email,
            name
        )

        return {

            "message":
                "Application rejected successfully",

            "id": str(
                object_id
            )
        }


    raise HTTPException(
        status_code=400,
        detail="Invalid application status"
    )


# =========================================================
# SHORTLIST
# ADMIN ONLY
# =========================================================

@app.post(
    "/shortlist/{application_id}"
)
async def shortlist_application(

    application_id: str,

    current_user=Depends(
        require_admin
    )
):

    return move_application(

        application_id,

        shortlisted,

        "shortlisted"
    )


# =========================================================
# REJECT
# ADMIN ONLY
# =========================================================

@app.post(
    "/reject/{application_id}"
)
async def reject_application(

    application_id: str,

    current_user=Depends(
        require_admin
    )
):

    return move_application(

        application_id,

        rejected,

        "rejected"
    )


# =========================================================
# LOGIN
# =========================================================

@app.post("/logincheck")
async def login(
    login: LoginData
):

    email = (
        login.email
        .strip()
        .lower()
    )

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

            valid_admin = verify_password(
                password,
                admin["password_hash"]
            )

        if not valid_admin and (admin.get("password") or admin.get("password_hash")):

            if admin.get("password") == password or admin.get("password_hash") == password:

                valid_admin = True

                admins.update_one(
                    {
                        "_id": admin["_id"]
                    },
                    {
                        "$set": {
                            "password_hash": hash_password(password)
                        },
                        "$unset": {
                            "password": ""
                        }
                    }
                )

        if not valid_admin:

            return {
                "success": False,
                "role": "admin",
                "message": "Incorrect password"
            }

        token = create_access_token(
            email,
            "admin"
        )

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
            "status": {
                "$ne": "disabled"
            }
        }
    )


    # =====================================================
    # MIGRATE OLD SHORTLISTED MEMBER
    # =====================================================

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
                    "password_hash": hash_password(old_password) if not old_password.startswith("$2") else old_password,
                    "Attendance": "100",
                    "createdAt": old_user.get("shortlistedAt", datetime.now(timezone.utc)),
                    "status": "active"
                }

                members.insert_one(user)

                shortlisted.update_one(
                    {
                        "_id": old_user["_id"]
                    },
                    {
                        "$unset": {
                            "password": ""
                        }
                    }
                )


    # =====================================================
    # MEMBER NOT FOUND
    # =====================================================

    if not user:

        return {
            "success": False,
            "role": "none",
            "message": "User not registered"
        }


    # =====================================================
    # MEMBER PASSWORD
    # =====================================================

    stored_hash = user.get("password_hash") or user.get("password")

    if not stored_hash:

        return {
            "success": False,
            "role": "member",
            "message": "Member password is not configured"
        }

    valid_member = verify_password(
        password,
        stored_hash
    )

    if not valid_member:
        if (user.get("password") and user.get("password") == password) or (user.get("password_hash") and user.get("password_hash") == password):
            valid_member = True

    if not valid_member:

        return {
            "success": False,
            "role": "member",
            "message": "Incorrect password"
        }

    # Auto-migrate plaintext password to password_hash if needed
    if user.get("password") or (user.get("password_hash") and user.get("password_hash") == password):
        members.update_one(
            {
                "_id": user["_id"]
            },
            {
                "$set": {
                    "password_hash": hash_password(password)
                },
                "$unset": {
                    "password": ""
                }
            }
        )

    # =====================================================
    # CREATE MEMBER JWT
    # =====================================================

    token = create_access_token(
        user["email"],
        "member"
    )

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
# VERIFY ADMIN JWT
# =========================================================

@app.post("/admin/verify")
async def verify_admin(

    current_user=Depends(
        require_admin
    )
):

    admin = admins.find_one(

        {
            "email":
                current_user["email"]
        }
    )

    if not admin:

        raise HTTPException(
            status_code=401,
            detail="Admin account not found"
        )


    return {

        "success": True,

        "role": "admin",

        "email":
            admin["email"]
    }


# =========================================================
# VERIFY MEMBER JWT
# =========================================================

@app.post("/member/verify")
async def verify_member(
    current_user=Depends(require_member)
):

    member = members.find_one(
        {
            "email": current_user["email"],
            "status": "active"
        }
    )

    if not member:

        raise HTTPException(
            status_code=401,
            detail="Member account not found or disabled"
        )

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
async def get_member_data(

    current_user=Depends(
        require_member
    )
):

    member = members.find_one(

        {
            "email":
                current_user["email"],

            "status":
                "active"
        }
    )


    if not member:

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )


    # Convert MongoDB ObjectId.

    member["id"] = str(
        member["_id"]
    )

    del member["_id"]


    # NEVER send password hash.

    member.pop(
        "password_hash",
        None
    )

    member.pop(
        "password",
        None
    )


    return {

        "success": True,

        "member": member
    }


# =========================================================
# OPTIONAL: DISABLE MEMBER
# ADMIN ONLY
# =========================================================

@app.post(
    "/member/disable/{email}"
)
async def disable_member(

    email: str,

    current_user=Depends(
        require_admin
    )
):

    result = members.update_one(

        {
            "email":
                email.strip().lower()
        },

        {
            "$set": {
                "status": "disabled"
            }
        }
    )


    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )


    return {

        "success": True,

        "message":
            "Member disabled successfully"
    }

# =========================================================
# CHANGE MEMBER PASSWORD
# =========================================================

@app.post("/member/change-password")
async def change_password(
    payload: ChangePasswordData,
    current_user=Depends(require_member)
):

    member = members.find_one(
        {
            "email": current_user["email"],
            "status": "active"
        }
    )

    if not member:

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    if not member.get("password_hash"):

        raise HTTPException(
            status_code=400,
            detail="Member password is not configured"
        )

    # Verify the current password.

    if not verify_password(
        payload.current_password,
        member["password_hash"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect"
        )

    # Basic validation on the new password.

    if len(payload.new_password) < 8:

        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters"
        )

    if payload.new_password == payload.current_password:

        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password"
        )

    try:

        new_hash = hash_password(
            payload.new_password
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    members.update_one(

        {
            "_id": member["_id"]
        },

        {
            "$set": {
                "password_hash": new_hash
            }
        }
    )

    # Issue a fresh token so the member stays
    # signed in after the password change.

    new_token = create_access_token(
        member["email"],
        "member"
    )

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
        "createdAt": (
            created_at.isoformat()
            if isinstance(created_at, datetime)
            else created_at
        ),
    }

    voters = poll.get("voters", {})

    if viewer_email is not None:
        result["myVote"] = voters.get(viewer_email)

    return result


# =========================================================
# CREATE POLL
# ADMIN ONLY
# =========================================================

@app.post("/admin/polls")
async def create_poll(
    payload: PollCreate,
    current_user=Depends(require_admin)
):

    question = payload.question.strip()

    cleaned_options = [
        o.strip() for o in payload.options if o.strip()
    ]

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Poll question is required"
        )

    if len(cleaned_options) < 2:

        raise HTTPException(
            status_code=400,
            detail="At least two options are required"
        )

    doc = {
        "question": question,
        "options": [
            {"text": o, "votes": 0} for o in cleaned_options
        ],
        "active": True,
        "createdAt": datetime.now(timezone.utc),
        "voters": {},
    }

    result = polls.insert_one(doc)

    doc["_id"] = result.inserted_id

    return {
        "success": True,
        "poll": serialize_poll(doc),
    }


# =========================================================
# LIST POLLS
# ANY AUTHENTICATED USER (admin or member)
# =========================================================

@app.get("/polls")
async def list_polls(
    current_user=Depends(get_current_user)
):

    all_polls = list(
        polls.find().sort("createdAt", -1)
    )

    return [
        serialize_poll(p, current_user["email"])
        for p in all_polls
    ]


# =========================================================
# VOTE ON A POLL
# MEMBER ONLY
# =========================================================

@app.post("/polls/{poll_id}/vote")
async def vote_poll(
    poll_id: str,
    payload: PollVote,
    current_user=Depends(require_member)
):

    object_id = get_id(poll_id)

    poll = polls.find_one({"_id": object_id})

    if not poll:

        raise HTTPException(
            status_code=404,
            detail="Poll not found"
        )

    if not poll.get("active", True):

        raise HTTPException(
            status_code=400,
            detail="This poll is closed"
        )

    email = current_user["email"]

    voters = poll.get("voters", {})

    if email in voters:

        raise HTTPException(
            status_code=400,
            detail="You have already voted on this poll"
        )

    option_texts = [
        o["text"] for o in poll.get("options", [])
    ]

    if payload.option not in option_texts:

        raise HTTPException(
            status_code=400,
            detail="Invalid option"
        )

    polls.update_one(
        {
            "_id": object_id,
            "options.text": payload.option,
        },
        {
            "$inc": {"options.$.votes": 1},
            "$set": {f"voters.{email}": payload.option},
        },
    )

    updated = polls.find_one({"_id": object_id})

    return {
        "success": True,
        "poll": serialize_poll(updated, email),
    }


# =========================================================
# TOGGLE POLL (open/close)
# ADMIN ONLY
# =========================================================

@app.post("/admin/polls/{poll_id}/toggle")
async def toggle_poll(
    poll_id: str,
    current_user=Depends(require_admin)
):

    object_id = get_id(poll_id)

    poll = polls.find_one({"_id": object_id})

    if not poll:

        raise HTTPException(
            status_code=404,
            detail="Poll not found"
        )

    new_state = not poll.get("active", True)

    polls.update_one(
        {"_id": object_id},
        {"$set": {"active": new_state}},
    )

    return {
        "success": True,
        "active": new_state,
    }


# =========================================================
# DELETE POLL
# ADMIN ONLY
# =========================================================

@app.delete("/admin/polls/{poll_id}")
async def delete_poll(
    poll_id: str,
    current_user=Depends(require_admin)
):

    object_id = get_id(poll_id)

    result = polls.delete_one({"_id": object_id})

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Poll not found"
        )

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
        "sentAt": (
            sent_at.isoformat()
            if isinstance(sent_at, datetime)
            else sent_at
        ),
    }


# =========================================================
# SEND NOTIFICATION
# ADMIN ONLY
# =========================================================

@app.post("/admin/notify")
async def send_notification(
    payload: notifyt,
    current_user=Depends(require_admin)
):

    message = payload.msg.strip()

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    doc = {
        "msg": message,
        "audience": payload.audience or "All members",
        "sentAt": datetime.now(timezone.utc),
    }

    result = notifica.insert_one(doc)

    doc["_id"] = result.inserted_id

    return {
        "success": True,
        "notification": serialize_notification(doc),
    }


# =========================================================
# LIST SENT NOTIFICATIONS
# ADMIN ONLY
# =========================================================

@app.get("/admin/notify")
async def list_notifications(
    current_user=Depends(require_admin)
):

    docs = list(
        notifica.find().sort("sentAt", -1).limit(50)
    )

    return [serialize_notification(d) for d in docs]


# =========================================================
# MEMBER NOTIFICATION FEED
# MEMBER ONLY
# =========================================================

@app.get("/member/notifications")
async def get_member_notifications(
    current_user=Depends(require_member)
):

    docs = list(
        notifica.find().sort("sentAt", -1).limit(20)
    )

    return {
        "success": True,
        "notifications": [
            serialize_notification(d) for d in docs
        ],
    }

# =========================================================
# GROWTH — SERIALIZATION HELPERS
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
        if viewer_email and (
            viewer_email == team["leaderEmail"]
            or viewer_email in team["memberEmails"]
        ):
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


# =========================================================
# GROWTH — MEMBER DIRECTORY
# =========================================================

@app.get("/growth/members")
async def growth_members(
    query: str = "",
    current_user=Depends(require_member)
):
    q = query.strip().lower()
    docs = list(members.find(
        {"status": "active"},
        {
            "_id": 1,
            "name": 1,
            "email": 1,
            "wing": 1,
            "skills": 1,
        }
    ).sort("name", 1).limit(100))

    result = []
    for member in docs:
        skills_value = member.get("skills", "")
        skills = (
            [s.strip() for s in skills_value.split(",") if s.strip()]
            if isinstance(skills_value, str)
            else skills_value or []
        )
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


# =========================================================
# GROWTH — EVENTS / WORKSHOPS
# =========================================================

@app.get("/growth/events")
async def list_growth_events(
    current_user=Depends(require_member)
):
    docs = list(growth_events.find().sort("createdAt", -1))
    return [
        serialize_growth_event(doc, current_user["email"])
        for doc in docs
    ]


@app.get("/admin/growth/events")
async def list_admin_growth_events(
    current_user=Depends(require_admin)
):
    docs = list(growth_events.find().sort("createdAt", -1))
    return [serialize_growth_event(doc) for doc in docs]


def event_is_ongoing(event):
    return str(event.get("status", "")).strip().lower() == "ongoing"


@app.post("/admin/growth/events")
async def create_growth_event(
    payload: GrowthEventCreate,
    current_user=Depends(require_admin)
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Event title is required")

    if payload.minTeam < 1 or payload.maxTeam < payload.minTeam:
        raise HTTPException(status_code=400, detail="Invalid team size")

    if payload.kind not in {"workshop", "event"}:
        raise HTTPException(status_code=400, detail="Invalid event type")

    allowed_categories = {"workshop", "technical", "non-technical"}
    if payload.category not in allowed_categories:
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

    return {
        "success": True,
        "event": serialize_growth_event(doc),
    }


@app.put("/admin/growth/events/{event_id}")
async def update_growth_event(
    event_id: str,
    payload: GrowthEventUpdate,
    current_user=Depends(require_admin)
):
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

    growth_events.update_one(
        {"_id": object_id},
        {"$set": updates}
    )

    updated = growth_events.find_one({"_id": object_id})
    return {
        "success": True,
        "event": serialize_growth_event(updated),
    }


@app.delete("/admin/growth/events/{event_id}")
async def delete_growth_event(
    event_id: str,
    current_user=Depends(require_admin)
):
    object_id = get_id(event_id)
    result = growth_events.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")

    return {"success": True}


@app.post("/growth/events/{event_id}/teams")
async def create_growth_team(
    event_id: str,
    payload: GrowthTeamCreate,
    current_user=Depends(require_member)
):
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
    requested_emails = [
        e.strip().lower() for e in payload.memberEmails if e.strip()
    ]
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
            raise HTTPException(
                status_code=409,
                detail="A member is already registered in another team for this event",
            )

    member_docs = list(members.find({
        "email": {"$in": emails},
        "status": "active",
    }))

    found = {m["email"].lower(): m for m in member_docs}
    missing = [email for email in emails if email not in found]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Member account not found: {missing[0]}",
        )

    member_list = [
        {
            "email": email,
            "name": found[email].get("name", "Member"),
            "wing": found[email].get("wing", ""),
        }
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
        {"$push": {"registrations": registration},
         "$set": {"updatedAt": datetime.now(timezone.utc)}}
    )

    updated = growth_events.find_one({"_id": object_id})
    return {
        "success": True,
        "event": serialize_growth_event(updated, leader_email),
    }


@app.post("/growth/events/{event_id}/teams/{team_id}/join")
async def join_growth_team(
    event_id: str,
    team_id: str,
    current_user=Depends(require_member)
):
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
                raise HTTPException(
                    status_code=409,
                    detail="You are already registered in another team for this event",
                )

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
async def choose_growth_event_winner(
    event_id: str,
    payload: GrowthAchievementCreate,
    current_user=Depends(require_admin)
):
    object_id = get_id(event_id)
    event = growth_events.find_one({"_id": object_id})

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    winner_email = payload.memberEmail.strip().lower()
    winner = members.find_one({
        "email": winner_email,
        "status": "active",
    })

    if not winner:
        raise HTTPException(status_code=404, detail="Winning member not found")

    registered = any(
        winner_email in team.get("memberEmails", [])
        for team in event.get("registrations", [])
    )
    if not registered:
        raise HTTPException(
            status_code=400,
            detail="Winner must be a registered participant in this event",
        )

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
        {"$set": {
            "applicantStatus": status,
            "lastEventWinAt": datetime.now(timezone.utc),
        }}
    )

    # Keep the recruitment/application record synchronized as well.
    shortlisted.update_many(
        {"email": winner_email},
        {"$set": {"applicantStatus": status}}
    )

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
        "achievement": serialize_achievement(
            growth_achievements.find_one({"_id": achievement.get("_id")})
        ) if achievement.get("_id") else None,
        "member": {
            "email": winner_email,
            "name": winner.get("name", "Member"),
            "applicantStatus": status,
        },
    }


# =========================================================
# GROWTH — COMBINED COURSES + ROADMAP
# =========================================================

@app.get("/growth/learning")
async def list_growth_learning(
    current_user=Depends(require_member)
):
    docs = list(growth_learning.find().sort("createdAt", -1))
    return [serialize_learning(doc) for doc in docs]


@app.get("/admin/growth/learning")
async def list_admin_growth_learning(
    current_user=Depends(require_admin)
):
    docs = list(growth_learning.find().sort("createdAt", -1))
    return [serialize_learning(doc) for doc in docs]


@app.post("/admin/growth/learning")
async def create_growth_learning(
    payload: GrowthLearningCreate,
    current_user=Depends(require_admin)
):
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

    return {
        "success": True,
        "learning": serialize_learning(doc),
    }


@app.delete("/admin/growth/learning/{learning_id}")
async def delete_growth_learning(
    learning_id: str,
    current_user=Depends(require_admin)
):
    object_id = get_id(learning_id)
    result = growth_learning.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Learning item not found")

    return {"success": True}


# =========================================================
# GROWTH — ASSIGNMENTS
# =========================================================

@app.get("/growth/assignments")
async def list_growth_assignments(
    current_user=Depends(require_member)
):
    member = members.find_one({
        "email": current_user["email"],
        "status": "active",
    })
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    wing = member.get("wing", "").strip()

    docs = list(growth_assignments.find({
        "$or": [
            {"wing": wing},
            {"wing": "All members"},
            {"wing": "all"},
        ]
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

    return [
        serialize_assignment(doc, current_user["email"])
        for doc in docs
    ]


@app.get("/admin/growth/assignments")
async def list_admin_growth_assignments(
    current_user=Depends(require_admin)
):
    docs = list(growth_assignments.find().sort("createdAt", -1))
    return [serialize_assignment(doc) for doc in docs]


@app.post("/admin/growth/assignments")
async def create_growth_assignment(
    payload: GrowthAssignmentCreate,
    current_user=Depends(require_admin)
):
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

    return {
        "success": True,
        "assignment": serialize_assignment(doc),
    }


@app.delete("/admin/growth/assignments/{assignment_id}")
async def delete_growth_assignment(
    assignment_id: str,
    current_user=Depends(require_admin)
):
    object_id = get_id(assignment_id)
    result = growth_assignments.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")

    growth_assignment_submissions.delete_many({
        "assignmentId": object_id
    })

    return {"success": True}


@app.post("/growth/assignments/{assignment_id}/submit")
async def submit_growth_assignment(
    assignment_id: str,
    payload: GrowthAssignmentSubmit,
    current_user=Depends(require_member)
):
    object_id = get_id(assignment_id)
    assignment = growth_assignments.find_one({"_id": object_id})

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    member = members.find_one({
        "email": current_user["email"],
        "status": "active",
    })
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
        {
            "assignmentId": object_id,
            "memberEmail": current_user["email"],
        },
        {"$set": submission},
        upsert=True,
    )

    return {
        "success": True,
        "assignment": serialize_assignment(
            assignment,
            current_user["email"],
        ),
    }


# =========================================================
# GROWTH — ACHIEVEMENTS
# =========================================================

@app.get("/growth/achievements")
async def list_growth_achievements(
    current_user=Depends(require_member)
):
    docs = list(
        growth_achievements.find({
            "memberEmail": current_user["email"]
        }).sort("createdAt", -1)
    )
    return [serialize_achievement(doc) for doc in docs]


@app.post("/admin/growth/achievements")
async def create_growth_achievement(
    payload: GrowthAchievementCreate,
    current_user=Depends(require_admin)
):
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

    return {
        "success": True,
        "achievement": serialize_achievement(doc),
    }
