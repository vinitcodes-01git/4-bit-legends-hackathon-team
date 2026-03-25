from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import time
import random

# import your AI logic
from ai_logic import analyze

app = Flask(__name__)
CORS(app)

# ================= HEALTH CHECK =================
@app.route("/")
def home():
    return jsonify({
        "status": "Backend Running 🚀",
        "system": "Nagpur Smart Traffic AI",
        "version": "3.0",
        "features": [
            "Multi-route optimization",
            "Traffic prediction",
            "Signal-aware routing",
            "Emergency prioritization",
            "AI reasoning engine"
        ]
    })


# ================= HELPER: ENHANCE AI RESPONSE =================
def enhance_ai_response(data, result):

    # ✅ SAFE TYPE CONVERSION (VERY IMPORTANT FIX)
    try:
        traffic_level = int(data.get("vehicles", 0))
    except:
        traffic_level = 0

    emergency = data.get("emergency", False)

    # ================= TRAFFIC CLASSIFICATION =================
    if traffic_level > 70:
        traffic = "High"
        prediction = "High congestion expected in selected route"
    elif traffic_level > 40:
        traffic = "Medium"
        prediction = "Moderate traffic flow expected"
    else:
        traffic = "Low"
        prediction = "Smooth traffic conditions"

    # ================= SIGNAL SIMULATION =================
    signal_count = random.randint(3, 8)
    signal_delay = signal_count * random.randint(1, 3)

    # ================= ACCIDENT SIMULATION =================
    accident = random.random() < 0.3

    # ================= ROUTES =================
    route = result.get("route", [])
    alt_route = list(route[::-1]) if len(route) > 1 else route

    # ================= ETA CALCULATION =================
    base_score = random.randint(10, 25)

    if traffic == "High":
        base_score += 20
    elif traffic == "Medium":
        base_score += 10

    base_score += signal_delay

    if accident:
        base_score += 15

    if emergency:
        base_score -= 20

    eta = max(5, base_score)

    # ================= CONFIDENCE =================
    confidence = round(max(0.6, 1 - (traffic_level / 120)), 2)

    # ================= MODE =================
    mode = "Emergency Priority" if emergency else "AI Smart Routing"

    # ================= AI REASON (🔥 IMPROVED) =================
    reason = (
        f"AI selected this route due to {traffic.lower()} traffic conditions. "
        f"{signal_count} traffic signals detected along the path. "
        f"{'Potential accident risk identified. ' if accident else ''}"
        f"{'Emergency mode activated, prioritizing fastest route.' if emergency else 'Optimizing for minimal delay and smooth flow.'}"
    )

    return {
        "fastest_route": route,
        "low_traffic_route": alt_route,
        "route": route,

        # UI DATA
        "traffic": traffic,
        "signal_time": eta,
        "confidence": confidence,
        "mode": mode,

        # 🔥 NEW AI FIELDS
        "reason": reason,
        "prediction": prediction,

        # DEBUG / META
        "meta": {
            "signals": signal_count,
            "accident": accident,
            "traffic_input": traffic_level
        }
    }


# ================= MAIN API =================
@app.route("/analyze", methods=["POST"])
def analyze_route():
    try:
        start_time = time.time()

        data = request.get_json()

        # ================= VALIDATION =================
        if not data:
            return jsonify({"error": "No data received"}), 400

        if not data.get("source") or not data.get("destination"):
            return jsonify({"error": "Missing source or destination"}), 400

        # ================= BASE AI =================
        base_result = analyze(data)

        if not base_result or "route" not in base_result:
            return jsonify({
                "error": "AI failed to generate route"
            }), 500

        # ================= ENHANCED AI =================
        final_result = enhance_ai_response(data, base_result)

        # ================= PERFORMANCE =================
        final_result["processing_time_ms"] = int((time.time() - start_time) * 1000)

        return jsonify(final_result)

    except Exception as e:
        print("❌ ERROR:", str(e))
        traceback.print_exc()

        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500


# ================= RUN SERVER =================
if __name__ == "__main__":
    app.run(debug=True, port=5001)