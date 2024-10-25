import threading

import cv2 as cv
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

from server import analyzer, tester

# Create Flask backend and enable cross-origin resource sharing
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

times = []
neck_angles = []
torso_angles = []


# Define the route we'll use to serve final analysis data as JSON.
# We're essentially making our own API for client-server comms.
@app.route("/get-data", methods=["GET"])
def get_data():
    neck_numpy = np.array(neck_angles)
    torso_numpy = np.array(torso_angles)

    good_rate = analyzer.calc_good_posture_rate(neck_numpy, torso_numpy)
    aura = analyzer.calc_aura(neck_numpy, torso_numpy)

    return (
        jsonify(
            {
                "neck": {
                    "times": times,
                    "angles": neck_angles,
                },
                "torso": {
                    "times": times,
                    "angles": torso_angles,
                },
                "goodPostureRate": good_rate,
                "aura": aura,
            }
        ),
        200,
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
    status, (neck_angle, torso_angle) = analyzer.analyze(image)

    threading.Thread(
        target=tester.test_one_frame,
        args=(image,),
        kwargs={"save_file": "test-output/test.jpg", "scale": 0.75},
    ).start()

    if status == analyzer.Status.SUCCESS:
        times.append(int(request.form["time"]))
        neck_angles.append(neck_angle)
        torso_angles.append(torso_angle)

        return (
            jsonify(
                {
                    "neckAngle": neck_angle,
                    "torsoAngle": torso_angle,
                }
            ),
            201,
        )

    return (
        jsonify(
            {
                "message": repr(status),
            }
        ),
        400,
    )


# Route to begin new monitoring session
@app.route("/new-session", methods=["POST"])
def new_session():
    times.clear()
    neck_angles.clear()
    torso_angles.clear()

    return jsonify({"message": "New monitoring session begun!"}), 201


# Driver code, starts the Flask server by hosting
# it locally on port 5000
if __name__ == "__main__":
    # tester.test_real_time(save_file="test-output/test.mp4", scale=0.75, save_fps=15)
    app.run(debug=True, port=5000)
