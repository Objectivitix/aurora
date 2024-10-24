import { memo, useRef, useEffect, useState } from "react";

export default memo(function Webcam({ intervalSecs, onCapture, hidden }) {
  const [isError, setIsError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const counter = useRef(0);

  // Start the webcam stream
  useEffect(() => {
    let webcamStream;

    (async () => {
      try {
        webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        webcamStream.getTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            setIsError(true);
          });
        });

        videoRef.current.srcObject = webcamStream;
        videoRef.current.addEventListener("loadedmetadata", () => {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        });
        setIsError(false);
      } catch (err) {
        setIsError(true);
      }
    })();

    return () => {
      webcamStream?.getTracks().forEach((track) => track.stop());
    };
  });

  // Capture the image from the webcam
  useEffect(() => {
    if (intervalSecs < 0 || onCapture === undefined) {
      return;
    }

    function capture() {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], "captured-image.png", {
          type: "image/png",
        });

        onCapture(file, counter.current * intervalSecs); // Call the onCapture prop with the captured file
        counter.current++;
      });
    }

    const interval = setInterval(capture, intervalSecs * 1000);
    const doesThisWork = setInterval(() => {
      capture();
      clearInterval(doesThisWork);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(doesThisWork);
    };
  }, [intervalSecs]);

  if (isError) {
    return (
      <div className="webcam">
        <p>
          We could not access your webcam. Please check permissions or hardware
          settings.
        </p>
      </div>
    );
  }

  return (
    <div className="webcam" style={{ display: hidden ? "none" : "contents" }}>
      <video ref={videoRef} autoPlay style={{ width: "50vw" }}></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
});
