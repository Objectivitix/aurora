import { useRef, useEffect, useState } from "react";

export default function WebcamCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Start the webcam stream
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Could not access the webcam.", err);
      }
    };
    startWebcam();
  }, []);

  // Start the countdown and capture the image
  const startCapture = () => {
    setCountdown(3); // Set initial countdown value to 3
    setIsCapturing(true);
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      captureImage();
      setIsCapturing(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Capture the image from the webcam
  const captureImage = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const file = new File([blob], "captured-image.png", {
        type: "image/png",
      });
      onCapture(file); // Call the onCapture prop with the captured file
    });
  };

  return (
    <div>
      <video ref={videoRef} autoPlay width="320" height="240"></video>
      <button onClick={startCapture} disabled={isCapturing}>
        {isCapturing ? "Capturing..." : "Capture Image"}
      </button>
      {isCapturing && <p>{countdown > 0 ? countdown : "Captured!"}</p>}
      <canvas
        ref={canvasRef}
        width="320"
        height="240"
        style={{ display: "none" }}
      ></canvas>
    </div>
  );
}
