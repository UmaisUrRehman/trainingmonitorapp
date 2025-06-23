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