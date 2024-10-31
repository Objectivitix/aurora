import argparse
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

production = True


def filter_angles(angles_with_none):
    arr = np.array(angles_with_none, dtype=np.float64)

    return arr[~np.isnan(arr)]


# Define the route we'll use to serve final analysis data as JSON.
# We're essentially making our own API for client-server comms.
@app.route("/get-data", methods=["GET"])
def get_data():
    neck_filtered = filter_angles(neck_angles)
    torso_filtered = filter_angles(torso_angles)

    good_rate = analyzer.calc_good_posture_rate(neck_filtered, torso_filtered)
    aura = analyzer.calc_aura(neck_filtered, torso_filtered)

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

    if not production:
        threading.Thread(
            target=tester.test_one_frame,
            args=(image,),
            kwargs={"save_file": "test-output/test.jpg", "scale": 0.75},
        ).start()

    times.append(int(request.form["time"]))
    neck_angles.append(neck_angle)
    torso_angles.append(torso_angle)

    return (
        jsonify(
            {
                "status": repr(status),
                "neckAngle": neck_angle,
                "torsoAngle": torso_angle,
            }
        ),
        201,
    )


# Route to begin new monitoring session
@app.route("/new-session", methods=["POST"])
def new_session():
    times.clear()
    neck_angles.clear()
    torso_angles.clear()

    return jsonify({"message": "New monitoring session begun!"}), 201


# Driver code for all non-production testing
if __name__ == "__main__":
    production = False

    parser = argparse.ArgumentParser(description="Run the Flask server")

    parser.add_argument(
        "--port", type=int, default=10000, help="Specify port on which server listens."
    )

    parser.add_argument(
        "--debug", action="store_true", help="Run server in debug mode."
    )

    parser.add_argument(
        "--real-time-model-test",
        action="store_true",
        help="Run real-time analyzer test instead of the server. If activated, port and debug are ignored.",
    )

    args = parser.parse_args()

    if args.real_time_model_test:
        tester.test_real_time(save_file="test-output/test.mp4", scale=0.75, save_fps=15)
    else:
        app.run("0.0.0.0", port=args.port, debug=args.debug)
