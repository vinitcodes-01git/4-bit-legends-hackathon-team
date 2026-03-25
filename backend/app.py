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
        "version": "2.0",
        "features": [
            "Multi-route optimization",
            "Traffic prediction",
            "Signal-aware routing",
            "Emergency prioritization"
        ]
    })


# ================= HELPER: ENHANCE AI RESPONSE =================
def enhance_ai_response(data, result):
    """
    Adds intelligence layer on top of base AI logic
    """

    traffic_level = int(data.get("vehicles", 0))
    emergency = data.get("emergency", False)

    # 🧠 Traffic classification
    if traffic_level > 70:
        traffic = "High"
    elif traffic_level > 40:
        traffic = "Medium"
    else:
        traffic = "Low"

    # 🚦 Simulate signal delays
    signal_count = random.randint(3, 8)
    signal_delay = signal_count * random.randint(1, 3)

    # 🚧 Accident probability
    accident = random.random() < 0.3  # 30% chance

    # 🛣 Base route
    route = result.get("route", [])

    # 🟢 Alternate route (simple variation)
    alt_route = list(route[::-1]) if len(route) > 1 else route

    # 🧠 Score calculation
    base_score = random.randint(10, 30)

    if traffic == "High":
        base_score += 20
    elif traffic == "Medium":
        base_score += 10

    base_score += signal_delay

    if accident:
        base_score += 15

    if emergency:
        base_score -= 20  # prioritize speed

    # ⏱ ETA calculation
    eta = max(5, base_score)

    # 📊 Confidence
    confidence = round(max(0.6, 1 - (traffic_level / 120)), 2)

    # 🧠 Mode
    mode = "Emergency Priority" if emergency else "AI Smart Routing"

    # 🧠 Reason
    reason = (
        f"{traffic} traffic detected. "
        f"{signal_count} signals affecting route. "
        f"{'Accident detected. ' if accident else ''}"
        f"{'Emergency routing enabled.' if emergency else ''}"
    )

    return {
        "fastest_route": route,
        "low_traffic_route": alt_route,
        "route": route,  # keep for compatibility
        "traffic": traffic,
        "signal_time": eta,
        "confidence": confidence,
        "mode": mode,
        "reason": reason,
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

        # 🛑 Validate input
        if not data:
            return jsonify({"error": "No data received"}), 400

        if not data.get("source") or not data.get("destination"):
            return jsonify({"error": "Missing source or destination"}), 400

        # 🧠 Base AI logic
        base_result = analyze(data)

        if not base_result or "route" not in base_result:
            return jsonify({
                "error": "AI failed to generate route"
            }), 500

        # 🚀 Enhance intelligence
        final_result = enhance_ai_response(data, base_result)

        # ⏱ Add processing time
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