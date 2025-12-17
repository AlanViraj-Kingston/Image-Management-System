from sqlalchemy import Column, Integer, String, Boolean, Date, Enum as SQLEnum, ForeignKey, text
from app.database import Base
import enum

class UserType(str, enum.Enum):
    PATIENT = "patient"
    STAFF = "staff"

class StaffRole(str, enum.Enum):
    DOCTOR = "doctor"
    RADIOLOGIST = "radiologist"
    CLERK = "clerk"
    ADMIN = "admin"

# Base User Table (Abstract-like)
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)  # Email for login (must be unique)
    password_hash = Column(String, nullable=False)  # Hashed password (never store plain text!)
    phone = Column(String)
    address = Column(String)
    is_active = Column(Boolean, default=True)
    user_type = Column(SQLEnum(UserType), nullable=False)

    # This setup tells SQLAlchemy to handle inheritance automatically
    __mapper_args__ = {
        "polymorphic_identity": UserType.STAFF,
        "polymorphic_on": user_type,
    }

# Patient Table (Inherits from User)
class Patient(User):
    __tablename__ = "patients"

    # The ID links back to the user table with foreign key relationship
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    patient_id = Column(Integer, unique=True, index=True, server_default=text("nextval('patient_id_seq')"))
    date_of_birth = Column(Date)
    conditions = Column(String)  # JSON string or comma-separated

    __mapper_args__ = {"polymorphic_identity": UserType.PATIENT}

# Medical Staff Table (Inherits from User)
class MedicalStaff(User):
    __tablename__ = "medical_staff"

    # The ID links back to the user table with foreign key relationship
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    staff_id = Column(Integer, unique=True, index=True, server_default=text("nextval('staff_id_seq')"))
    department = Column(String)
    role = Column(SQLEnum(StaffRole))

    __mapper_args__ = {"polymorphic_identity": UserType.STAFF}


