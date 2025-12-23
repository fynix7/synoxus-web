from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import sys
import os

# Ensure we can import main.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import run as run_scout

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/scout', methods=['POST'])
def scout():
    data = request.json
    channel_url = data.get('channelUrl')
    
    if not channel_url:
        return jsonify({"error": "Channel URL is required"}), 400

    print(f"Received scout request for: {channel_url}")
    
    try:
        # Run the async scout function
        asyncio.run(run_scout(channel_url))
        return jsonify({"success": True, "message": "Scouting completed successfully"})
    except Exception as e:
        print(f"Error during scouting: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running"}), 200

@app.route('/', methods=['GET'])
def index():
    return "<h1>Outlier Scout Service is Running 🚀</h1><p>Use the /scout endpoint to trigger scouting.</p>", 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Scout Server running on port {port}")
    app.run(host='0.0.0.0', port=port)
