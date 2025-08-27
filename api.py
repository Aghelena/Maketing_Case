\
import os
import datetime as dt
from dateutil.parser import isoparse
from functools import wraps

import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import jwt

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
USERS_PATH = os.path.join(DATA_DIR, "users.xlsx")
METRICS_PATH = os.path.join(DATA_DIR, "metrics.csv")
TOKEN_EXP_MINUTES = int(os.environ.get("TOKEN_EXP_MINUTES", "240"))

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

def load_users():
    df = pd.read_excel(USERS_PATH)
    df.columns = [c.strip().lower() for c in df.columns]

    # If 'email' missing, try derive from 'user'/'username' by appending @example.com
    if "email" not in df.columns:
        if "user" in df.columns:
            base = df["user"].astype(str).str.strip()
            df["email"] = base.where(base.str.contains("@"), base + "@example.com")
        elif "username" in df.columns:
            base = df["username"].astype(str).str.strip()
            df["email"] = base.where(base.str.contains("@"), base + "@example.com")
        else:
            raise RuntimeError("Missing columns in users file: {'email'} (accepted: 'user' or 'username' to derive)")

    required = {"email", "password", "role"}
    missing = required - set(df.columns)
    if missing:
        raise RuntimeError(f"Missing columns in users file: {missing}")
    return df[["email", "password", "role"]].copy()

def load_metrics():
    df = pd.read_csv(METRICS_PATH)
    df.columns = [c.strip().lower() for c in df.columns]
    if "date" not in df.columns:
        raise RuntimeError("Metrics file must have a 'date' column (YYYY-MM-DD).")
    df["date"] = pd.to_datetime(df["date"]).dt.date
    return df

USERS_DF = load_users()
METRICS_DF = load_metrics()

# Debug (can remove later)
try:
    print("USERS_DF emails/roles:", USERS_DF[["email","role"]].to_dict("records"))
except Exception as _e:
    print("USERS_DF loaded.")

def generate_token(payload: dict):
    now = dt.datetime.utcnow()
    exp = now + dt.timedelta(minutes=TOKEN_EXP_MINUTES)
    to_encode = {"exp": exp, "iat": now, **payload}
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth.split(" ", 1)[1].strip()
        try:
            claims = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        request.user = claims
        return f(*args, **kwargs)
    return wrapper

@app.route("/")
def root():
    return send_from_directory(app.static_folder, "index.html")

@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = (payload.get("password") or "").strip()  # strip for accidental spaces
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    row = USERS_DF.loc[USERS_DF["email"].str.lower() == email]
    print("[LOGIN] email:", email, "found?", not row.empty)  # debug
    if row.empty:
        return jsonify({"error": "Invalid credentials"}), 401

    rec = row.iloc[0].to_dict()
    print("[LOGIN] compare passwords:", str(rec["password"]), "vs", str(password))  # debug
    if str(rec["password"]) != str(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token({"sub": email, "role": rec["role"]})
    return jsonify({"token": token, "email": email, "role": rec["role"]})

@app.get("/api/metrics")
@auth_required
def metrics():
    start = request.args.get("start")
    end = request.args.get("end")
    sort_col = request.args.get("sort")
    order = (request.args.get("order") or "asc").lower()
    role = request.user.get("role", "user")

    df = METRICS_DF.copy()

    if start:
        try:
            df = df[df["date"] >= isoparse(start).date()]
        except Exception:
            return jsonify({"error": "Invalid start date"}), 400
    if end:
        try:
            df = df[df["date"] <= isoparse(end).date()]
        except Exception:
            return jsonify({"error": "Invalid end date"}), 400

    if role != "admin" and "cost_micros" in df.columns:
        df = df.drop(columns=["cost_micros"])

    if sort_col:
        sort_col = sort_col.strip().lower()
        if sort_col not in df.columns:
            return jsonify({"error": f"sort column '{sort_col}' not found"}), 400
        df = df.sort_values(by=sort_col, ascending=(order != "desc"), kind="mergesort")

    return jsonify({"columns": df.columns.tolist(), "rows": df.to_dict(orient="records")})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))  # default 5001
    app.run(host="0.0.0.0", port=port, debug=True)
