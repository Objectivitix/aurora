from flask import Flask, jsonify, request
from flask_cors import CORS

# Create Flask backend and enable cross-origin resource sharing
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# Define the route we'll use to serve final analysis data as JSON.
# We're essentially making our own API for client-server comms.
@app.route("/get-data", methods=["GET"])
def get_data():
    return jsonify(
        {
            "neck": {
                "times": [0, 10, 20, 30, 50, 60],
                "angles": [12, 11, 13, 12, 13, 13],
            },
            "torso": {
                "times": [0, 20, 30, 50, 60],
                "angles": [8, 9, 11, 9, 10],
            },
            "good_posture_rate": 1.0,
            "aura": 250,
        }
    )


# The route we'll use to receive and process
# frames that client sends over for analysis
@app.route("/submit-frame", methods=["POST"])
def submit_frame():
    pass


# Route to begin new monitoring session
@app.route("/new-session", methods=["POST"])
def new_session():
    pass


# Driver code, starts the Flask server by hosting
# it locally on port 5000
if __name__ == "__main__":
    app.run(debug=True, port=5000)
