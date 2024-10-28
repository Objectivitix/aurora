import atexit
from enum import Enum
from typing import NamedTuple, Optional, TypeAlias

import numpy as np
import cv2 as cv
import mediapipe as mp

Point: TypeAlias = np.ndarray[np.float64]
Angles: TypeAlias = np.ndarray[np.float64]
Model: TypeAlias = mp.solutions.pose.Pose

draw = mp.solutions.drawing_utils
styles = mp.solutions.drawing_styles
pose = mp.solutions.pose

NECK_ANGLE_OFFSET = 12
STANDARD_INPUT_WIDTH = 1280

default_model = pose.Pose(
    static_image_mode=True,
    model_complexity=2,
    min_detection_confidence=0.6,
)

atexit.register(lambda: default_model.close())


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

    return ear_offset < 0.09 and shoulder_offset < 0.14 and hip_offset < 0.12


def calc_posture_angles(joints: Joints) -> tuple[int, int]:
    ear = (joints.l_ear.pos + joints.r_ear.pos) / 2
    shoulder = (joints.l_shoulder.pos + joints.r_shoulder.pos) / 2
    hip = (joints.l_hip.pos + joints.r_hip.pos) / 2

    if ear.shape == (2,):
        upwards_nudge = np.array([0, 1])
    else:
        upwards_nudge = np.array([0, 1, 0])

    neck_angle = abs(calc_angle(ear, shoulder, hip) - NECK_ANGLE_OFFSET)
    torso_angle = calc_angle(shoulder, hip, hip + upwards_nudge)

    return neck_angle, torso_angle


def analyze(
    image: np.ndarray,
) -> tuple[Status, tuple[float, float] | tuple[None, None]]:
    resized = standardize_width(image)

    # Convert the image to RGB format for MediaPipe Pose processing
    rgb_image = cv.cvtColor(resized, cv.COLOR_BGR2RGB)

    # Process the image with the Pose model
    results = default_model.process(rgb_image)

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


def calc_good_posture_rate(
    neck_angles: Angles, torso_angles: Angles
) -> Optional[float]:
    if neck_angles.shape == (0,) and torso_angles.shape == (0,):
        return None

    return float(
        (sum(neck_angles < 18) + sum(torso_angles < 10))
        / (len(neck_angles) + len(torso_angles))
    )


def calc_aura(neck_angles: Angles, torso_angles: Angles) -> int:
    return int(sum((18 - neck_angles) * 10) + sum((10 - torso_angles) * 10))


def standardize_width(image: np.ndarray) -> np.ndarray:
    height, width, *_ = image.shape

    # Calculate the new height, keeping aspect ratio
    resize_ratio = STANDARD_INPUT_WIDTH / width
    new_height = int(height * resize_ratio)

    # Resize the image
    return cv.resize(image, (STANDARD_INPUT_WIDTH, new_height))
