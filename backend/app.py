from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Correct path to AI folder
sys.path.append(os.path.abspath("../"))

# Import AI function
from ai.ai_logic import analyze

# Initialize app
app = Flask(__name__)
CORS(app)

# Test route
@app.route("/")
def home():
    return "Backend running"

# AI route
@app.route("/analyze", methods=["POST"])
def analyze_route():
    try:
        data = request.json
        result = analyze(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run server
if __name__ == "__main__":
    app.run(debug=True)