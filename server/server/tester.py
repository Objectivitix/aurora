from typing import Optional, TypeAlias

import numpy as np
import cv2 as cv
import mediapipe as mp

from . import analyzer

Model: TypeAlias = mp.solutions.pose.Pose

draw = mp.solutions.drawing_utils
styles = mp.solutions.drawing_styles
pose = mp.solutions.pose


def process_frame(image: np.ndarray, *, model: Optional[Model] = None) -> np.ndarray:
    resized = analyzer.standardize_width(image)

    results = (model or analyzer.default_model).process(
        cv.cvtColor(resized, cv.COLOR_BGR2RGB)
    )

    if results.pose_landmarks is None:
        cv.putText(
            resized, "NO PERSON DETECTED", (10, 30), cv.FONT_ITALIC, 0.6, (0, 0, 255), 2
        )
        return resized

    draw.draw_landmarks(
        resized,
        results.pose_landmarks,
        pose.POSE_CONNECTIONS,
        landmark_drawing_spec=styles.get_default_pose_landmarks_style(),
    )

    landmarks = results.pose_landmarks.landmark
    joints = analyzer.get_joints(landmarks, two_d=True)

    if analyzer.is_aligned(joints):
        cv.putText(resized, "Aligned", (25, 70), cv.FONT_ITALIC, 1.5, (0, 255, 0), 5)
    else:
        cv.putText(resized, "Misaligned", (25, 70), cv.FONT_ITALIC, 1.5, (0, 0, 255), 5)

    if analyzer.is_visible(joints):
        cv.putText(resized, "Good Data", (300, 70), cv.FONT_ITALIC, 1.5, (0, 255, 0), 5)
    else:
        cv.putText(resized, "Bad Data", (300, 70), cv.FONT_ITALIC, 1.5, (0, 0, 255), 5)

    neck_angle, torso_angle = analyzer.calc_posture_angles(joints)

    cv.putText(
        resized,
        text=f"neck: {neck_angle:.1f}, torso: {torso_angle:.1f}",
        org=(25, 135),
        fontFace=cv.FONT_ITALIC,
        fontScale=1.5,
        color=(0, 0, 0),
        thickness=5,
    )

    return resized


def test_one_frame(
    image: np.ndarray, *, scale: float = 2, save_file: Optional[str] = None
):
    processed = process_frame(image)

    height, width, *_ = processed.shape
    final_size = int(width * scale), int(height * scale)

    resized = cv.resize(processed, final_size, interpolation=cv.INTER_AREA)

    if save_file is not None:
        cv.imwrite(save_file, resized)

    cv.imshow("Analyzer One-Frame Test", resized)
    cv.waitKey(0)
    cv.destroyAllWindows()


def test_real_time(
    *, scale: float = 2, save_file: Optional[str] = None, save_fps: int = 10
):
    webcam = cv.VideoCapture(0)

    width = int(webcam.get(cv.CAP_PROP_FRAME_WIDTH) * scale)
    height = int(webcam.get(cv.CAP_PROP_FRAME_HEIGHT) * scale)

    if save_file is not None:
        codec = cv.VideoWriter_fourcc(*"mp4v")
        writer = cv.VideoWriter(save_file, codec, save_fps, (width, height))

    with pose.Pose(
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.65,
    ) as model:

        while webcam.isOpened():
            success, image = webcam.read()

            if not success:
                print("LOG: Skipped a bad-camera frame")
                continue

            processed = process_frame(image, model=model)

            height, width, *_ = processed.shape
            final_size = int(width * scale), int(height * scale)

            resized = cv.resize(processed, final_size, interpolation=cv.INTER_AREA)

            cv.imshow("Analyzer Real-Time Test", resized)

            if save_file is not None:
                writer.write(resized)

            if (
                cv.waitKey(5) & 0xFF == ord("q")
                or cv.getWindowProperty("Analyzer Real-Time Test", cv.WND_PROP_VISIBLE)
                < 1
            ):
                break

    webcam.release()
    cv.destroyAllWindows()
