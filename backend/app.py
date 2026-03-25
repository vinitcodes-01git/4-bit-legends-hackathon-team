from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# import your AI logic
from ai_logic import analyze

app = Flask(__name__)
CORS(app)  # allow frontend connection

# ================= HEALTH CHECK =================
@app.route("/")
def home():
    return jsonify({
        "status": "Backend Running 🚀",
        "message": "Nagpur Smart Traffic AI is active"
    })


# ================= MAIN API =================
@app.route("/analyze", methods=["POST"])
def analyze_route():
    try:
        data = request.get_json()

        # 🛑 Validate input
        if not data:
            return jsonify({"error": "No data received"}), 400

        if not data.get("source") or not data.get("destination"):
            return jsonify({"error": "Missing source or destination"}), 400

        # 🧠 Call AI logic
        result = analyze(data)

        # 🛑 Validate AI response
        if not result or "route" not in result:
            return jsonify({
                "error": "AI failed to generate route"
            }), 500

        return jsonify(result)

    except Exception as e:
        print("❌ ERROR:", str(e))
        traceback.print_exc()

        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500


# ================= RUN SERVER =================
if __name__ == "__main__":
    app.run(debug=True)