from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import random
import string
import sqlite3
import qrcode
import os

app = Flask(__name__)
CORS(app)

# === ROUTES ===
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/join-session')
def join_session_page():
    session_id = request.args.get('session')
    return render_template('joinsession.html', session_id=session_id)

@app.route('/controlVitals')
def control_vitals():
    return render_template('controlVitals.html')

@app.route('/displayMonitor')
def display_monitor():
    return render_template('displayMonitor.html')

@app.route('/changeSessionID')
def change_session_id():
    return render_template('changeSessionID.html')

@app.route('/about')
def about():
    return render_template('about.html')


# === DATABASE SETUP ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "session_data.db")
QR_DIR = os.path.join(BASE_DIR, "static", "qr_codes")
os.makedirs(QR_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            qr_code TEXT,
            heart_rate INTEGER,
            respiratory_rate INTEGER,
            systolic_bp INTEGER,
            diastolic_bp INTEGER,
            spo2 INTEGER,
            etco2 INTEGER
        )
    """)
    conn.commit()
    conn.close()

init_db()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# === API ENDPOINTS ===


# === Generate ID rout ===
# Function
def generate_session_id(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
#Route
@app.route('/generate-id', methods=['GET'])
def generate_id():
    session_id = generate_session_id()
    return jsonify({"session_id": session_id})

#Set session ID function
@app.route("/set_session", methods=["POST"])
def set_session():
    try:
        data = request.json
        session_id = data.get("sessionId")
        if not session_id:
            return jsonify({"success": False, "message": "Missing session ID."})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if session exists
        cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
        existing = cursor.fetchone()

        if existing:
            return jsonify({"success": False, "exists": True})

        # Default vital signs
        vitals = {
            "hr": 80,
            "rr": 16,
            "sbp": 120,
            "dbp": 80,
            "spo2": 98,
            "etco2": 38
        }

        # Generate QR Code (do not modify)
        qr_data = f"trainingmonitorapp.com/join-session?session={session_id}"
        qr_path = os.path.join(QR_DIR, f"{session_id}.png")
        
        # Create QR code with proper sizing
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(qr_path)

        # Insert new session with default vitals
        cursor.execute("""
            INSERT INTO sessions 
            (session_id, qr_code, heart_rate, respiratory_rate, systolic_bp, diastolic_bp, spo2, etco2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            qr_path,
            vitals["hr"],
            vitals["rr"],
            vitals["sbp"],
            vitals["dbp"],
            vitals["spo2"],
            vitals["etco2"]
        ))

        conn.commit()

        # Debug/confirmation print to verify
        print(f"[INFO] Created session {session_id} with vitals: {vitals}")

        conn.close()

        return jsonify({"success": True, "exists": False})

    except Exception as e:
        print("[ERROR] Failed to set session:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500




#Update the vitals in the database when apply is clicked on the control vitals page
@app.route('/update_vitals', methods=['POST'])
def update_vitals():
    try:
        data = request.get_json()
        session_id = data.get("sessionId")

        if not session_id:
            return jsonify(success=False, message="Session ID is missing.")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE sessions SET
                heart_rate = ?,
                respiratory_rate = ?,
                spo2 = ?,
                systolic_bp = ?,
                diastolic_bp = ?,
                etco2 = ?
            WHERE session_id = ?
        """, (
            data.get("hr", 0),
            data.get("rr", 0),
            data.get("spo2", 0),
            data.get("sbp", 0),
            data.get("dbp", 0),
            data.get("etco2", 0),
            session_id
        ))

        conn.commit()
        conn.close()
        return jsonify(success=True)

    except Exception as e:
        print("Error:", e)
        return jsonify(success=False, message=str(e))



@app.route('/get_session_data', methods=['GET'])
def get_session_data():
    session_id = request.args.get("sessionId")
    if not session_id:
        return jsonify({"success": False, "message": "Session ID is required."})

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
        session = cursor.fetchone()
        conn.close()

        if not session:
            return jsonify({"success": False, "message": "Session not found."})

        return jsonify({
            "success": True,
            "session_id": session["session_id"],
            "hr": session["heart_rate"],
            "rr": session["respiratory_rate"],
            "sbp": session["systolic_bp"],
            "dbp": session["diastolic_bp"],
            "spo2": session["spo2"],
            "etco2": session["etco2"]
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "message": str(e)})


        
#Join the session using the Session Id as
@app.route('/join_session', methods=['POST'])
def join_session_api():
    try:
        session_id = request.json.get('sessionId')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
        session = cursor.fetchone()
        conn.close()

        if session:
            return jsonify({
                "success": True,
                "session_id": session["session_id"],
                "hr": session["heart_rate"],
                "rr": session["respiratory_rate"],
                "sbp": session["systolic_bp"],
                "dbp": session["diastolic_bp"],
                "spo2": session["spo2"],
                "etco2": session["etco2"]
            })
        else:
            return jsonify({"success": False, "message": "Session not found"}), 404

    except Exception as e:
        print("Error joining session:", e)
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
