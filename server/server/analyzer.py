import atexit
from enum import Enum
from typing import NamedTuple, TypeAlias

import numpy as np
import cv2 as cv
import mediapipe as mp

Point: TypeAlias = np.ndarray[np.float64]

draw = mp.solutions.drawing_utils
styles = mp.solutions.drawing_styles
pose = mp.solutions.pose

NECK_ANGLE_OFFSET = 12

model = pose.Pose(
    model_complexity=2,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

atexit.register(lambda: model.close())


class Status(Enum):
    SUCCESS = object()
    NO_PERSON_DETECTED = object()
    CAMERA_MISALIGNED = object()
    BAD_VISIBILITY = object()

    def __repr__(self):
        return self._name_


class Joint(NamedTuple):
    pos: Point
    visibility: float


class Joints(NamedTuple):
    l_ear: Joint
    r_ear: Joint
    l_shoulder: Joint
    r_shoulder: Joint
    l_hip: Joint
    r_hip: Joint


def calc_dist(p: Point, q: Point) -> float:
    return np.linalg.norm(q - p)


def calc_angle(p: Point, q: Point, r: Point) -> float:
    a = p - q
    b = q - r

    cosine_angle = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    return np.rad2deg(np.arccos(cosine_angle))


def get_joint(landmark, *, two_d: bool = False) -> Point:
    if two_d:
        return Joint(np.array([landmark.x, landmark.y]), landmark.visibility)

    return Joint(np.array([landmark.x, landmark.y, landmark.z]), landmark.visibility)


def get_joints(landmarks, *, two_d: bool = False) -> Joints:
    return Joints(
        get_joint(landmarks[pose.PoseLandmark.LEFT_EAR], two_d=two_d),
        get_joint(landmarks[pose.PoseLandmark.RIGHT_EAR], two_d=two_d),
        get_joint(landmarks[pose.PoseLandmark.LEFT_SHOULDER], two_d=two_d),
        get_joint(landmarks[pose.PoseLandmark.RIGHT_SHOULDER], two_d=two_d),
        get_joint(landmarks[pose.PoseLandmark.LEFT_HIP], two_d=two_d),
        get_joint(landmarks[pose.PoseLandmark.RIGHT_HIP], two_d=two_d),
    )


def is_visible(joints: Joints) -> bool:
    return (
        joints.l_ear.visibility + joints.r_ear.visibility > 0.8
        and joints.l_shoulder.visibility + joints.r_shoulder.visibility > 0.8
        and joints.l_hip.visibility + joints.r_hip.visibility > 0.3
    )


def is_aligned(joints: Joints) -> bool:
    assert joints.l_ear.pos.shape == (2,)

    ear_offset = calc_dist(joints.l_ear.pos, joints.r_ear.pos)
    shoulder_offset = calc_dist(joints.l_shoulder.pos, joints.r_shoulder.pos)
    hip_offset = calc_dist(joints.l_hip.pos, joints.r_hip.pos)

    print(f"DEBUG: {ear_offset:.2f} {shoulder_offset:.2f} {hip_offset:.2f}")

    return ear_offset < 0.05 and shoulder_offset < 0.14 and hip_offset < 0.12


def calc_posture_angles(joints: Joints) -> tuple[int, int]:
    ear = (joints.l_ear.pos + joints.r_ear.pos) / 2
    shoulder = (joints.l_shoulder.pos + joints.r_shoulder.pos) / 2
    hip = (joints.l_hip.pos + joints.r_hip.pos) / 2

    if ear.shape == (2,):
        upwards_nudge = np.array([0, 1])
    else:
        upwards_nudge = np.array([0, 1, 0])

    neck_angle = calc_angle(ear, shoulder, hip) - NECK_ANGLE_OFFSET
    torso_angle = calc_angle(shoulder, hip, hip + upwards_nudge)

    # print(f"DEBUG: {neck_angle:.2f} {torso_angle:.2f}")

    return neck_angle, torso_angle


def analyze(image: np.ndarray) -> tuple[int, tuple[float, float]]:
    # Convert the image to RGB format for MediaPipe Pose processing
    rgb_image = cv.cvtColor(image, cv.COLOR_BGR2RGB)

    # Process the image with the Pose model
    results = model.process(rgb_image)

    # Check if the landmarks even exist
    if results.pose_landmarks is None:
        return Status.NO_PERSON_DETECTED, (None, None)

    landmarks = results.pose_landmarks.landmark
    joints = get_joints(landmarks, two_d=True)

    # Check if camera is aligned to person's side profile
    if not is_aligned(joints):
        return Status.CAMERA_MISALIGNED, (None, None)

    # Check if we have good visibility on the joints
    if not is_visible(joints):
        return Status.BAD_VISIBILITY, (None, None)

    # If everything's good, calc the posture angles and return
    return Status.SUCCESS, calc_posture_angles(joints)


def test_real_time(*, scale: float = 2, save_file: str = None, save_fps: int = 10):
    webcam = cv.VideoCapture(0)

    width = int(webcam.get(cv.CAP_PROP_FRAME_WIDTH) * scale)
    height = int(webcam.get(cv.CAP_PROP_FRAME_HEIGHT) * scale)

    if save_file is not None:
        codec = cv.VideoWriter_fourcc(*"mp4v")
        writer = cv.VideoWriter(save_file, codec, save_fps, (width, height))

    with pose.Pose(
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.4,
        min_tracking_confidence=0.4,
    ) as model:

        while webcam.isOpened():
            success, image = webcam.read()

            if not success:
                print("LOG: Skipped a bad-camera frame")
                continue

            results = model.process(cv.cvtColor(image, cv.COLOR_BGR2RGB))

            if results.pose_landmarks is None:
                print("LOG: Skipped a no-person-detected frame")
                continue

            draw.draw_landmarks(
                image,
                results.pose_landmarks,
                pose.POSE_CONNECTIONS,
                landmark_drawing_spec=styles.get_default_pose_landmarks_style(),
            )

            landmarks = results.pose_landmarks.landmark
            joints = get_joints(landmarks, two_d=True)

            if is_aligned(joints):
                cv.putText(
                    image, "Aligned", (10, 30), cv.FONT_ITALIC, 0.6, (0, 255, 0), 2
                )
            else:
                cv.putText(
                    image, "Misaligned", (10, 30), cv.FONT_ITALIC, 0.6, (0, 0, 255), 2
                )

            if is_visible(joints):
                cv.putText(
                    image, "Good Data", (130, 30), cv.FONT_ITALIC, 0.6, (0, 255, 0), 2
                )
            else:
                cv.putText(
                    image, "Bad Data", (130, 30), cv.FONT_ITALIC, 0.6, (0, 0, 255), 2
                )

            neck_angle, torso_angle = calc_posture_angles(joints)

            cv.putText(
                image,
                text=f"neck: {neck_angle:.1f}, torso: {torso_angle:.1f}",
                org=(10, 60),
                fontFace=cv.FONT_ITALIC,
                fontScale=0.6,
                color=(0, 0, 0),
                thickness=2,
            )

            image = cv.resize(image, (width, height), interpolation=cv.INTER_AREA)

            cv.imshow("Analyzer Real-Time Test", image)

            if save_file is not None:
                writer.write(image)

            if (
                cv.waitKey(5) & 0xFF == ord("q")
                or cv.getWindowProperty("Analyzer Real-Time Test", cv.WND_PROP_VISIBLE)
                < 1
            ):
                break

    webcam.release()
    cv.destroyAllWindows()
