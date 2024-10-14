import cv2 as cv
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

from server import analyzer

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
    # Receive the image file from the client
    image_file = request.files["image"]

    # Convert the file to a NumPy array, then read with OpenCV
    mat = np.frombuffer(image_file.read(), np.uint8)
    image = cv.imdecode(mat, cv.IMREAD_COLOR)

    # Delegate posture analysis to our analyzer
    status, posture_angles = analyzer.analyze(image)
    print(status, posture_angles)

    if status == analyzer.Status.SUCCESS:
        neck_angle, torso_angle = posture_angles
        print(neck_angle, torso_angle)

        return (
            jsonify(
                {
                    "status": "success",
                    "neck_angle": neck_angle,
                    "torso_angle": torso_angle,
                }
            ),
            200,
        )

    return (
        jsonify(
            {
                "status": "error",
                "message": "No person, camera misalignment, or bad data",
            }
        ),
        400,
    )


# Route to begin new monitoring session
@app.route("/new-session", methods=["POST"])
def new_session():
    pass


# Driver code, starts the Flask server by hosting
# it locally on port 5000
if __name__ == "__main__":
    # analyzer.test_real_time(save_file="test.mp4", save_fps=60)
    app.run(debug=True, port=5000)
