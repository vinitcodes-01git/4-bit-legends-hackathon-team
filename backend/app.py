from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)   
CORS(app)

@app.route("/")
def home():
    return "Backend running 🚀"

@app.route("/analyze", methods=["POST"])
def analyze_route():
    try:
        data = request.get_json()

        # extract data
        vehicles = data.get("vehicles", 0)
        time = data.get("time")
        source = data.get("source")
        destination = data.get("destination")
        emergency = data.get("emergency", False)

        # TEMP logic
        traffic = "High" if vehicles > 50 else "Low"

        route = ["A", "C", "D"]
        signal_time = min(90, int(20 + vehicles * 0.7))

        mode = "Emergency" if emergency else "Normal"

        return jsonify({
            "traffic": traffic,
            "route": route,
            "signal_time": signal_time,
            "mode": mode,
            "confidence": 0.8,
            "reason": "Based on traffic conditions"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)