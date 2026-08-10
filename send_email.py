import smtplib
from email.message import EmailMessage


# ==============================
# SMTP SETTINGS
# ==============================

SENDER_EMAIL = "fastotrian@gmail.com"
APP_PASSWORD = "uuaf qzrl vbog vdxo"

RECEIVER_EMAIL = "guntijoy1202@gmail.com"


# ==============================
# EMAIL
# ==============================

msg = EmailMessage()

msg["From"] = SENDER_EMAIL
msg["To"] = RECEIVER_EMAIL
msg["Subject"] = "CREST SMTP Test"

msg.set_content(
    """Hello,

This is a test email from the CREST FastAPI project.

SMTP is working successfully.

Regards,
CREST Team
"""
)
msg.set_content(
    """Hello,

This is a test email from the CREST FastAPI project.
ng
SMTP is working successfully.

Regards,
CREST Team
"""
)


# ==============================
# SEND
# ==============================

try:

    print("Connecting to Gmail SMTP...")

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465
    ) as server:

        server.login(
            SENDER_EMAIL,
            APP_PASSWORD
        )

        print("Logged in successfully.")

        server.send_message(msg)

    print("Email sent successfully!")

except Exception as e:

    print("Email failed.")
    print("Error:", e)

try:

    print("Connecting to Gmail SMTP...")

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465
    ) as server:

        server.login(
            SENDER_EMAIL,
            APP_PASSWORD
        )

        print("Logged in successfully.")

        server.send_message(msg)

    print("Email sent successfully!")

except Exception as e:

    print("Email failed.")
    print("Error:", e)    