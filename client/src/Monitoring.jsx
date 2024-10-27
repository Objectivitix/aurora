import { useCallback, useEffect } from "react";
import Countdown, { Unit } from "./Countdown";
import Webcam from "./Webcam";
import "./Monitoring.css";

export default function Monitoring({ interval, duration, onStop }) {
  useEffect(() => {
    const timeout = setTimeout(onStop, duration * 60 * 1000 + 2000);

    return () => clearTimeout(timeout);
  }, []);

  const uploadFrame = useCallback(async (file, time) => {
    const formData = new FormData();

    formData.append("image", file);
    formData.append("time", time);

    try {
      const response = await fetch("http://localhost:5000/submit-frame", {
        method: "POST",
        body: formData,
      });

      if (response.status === 201) {
        console.log("LOG: Good frame posted.");
      } else {
        console.log("LOG: Bad frame posted.");
      }
    } catch (_) {
      console.error("Failed to upload image to server.");
    }
  });

  return (
    <div className="body monitoring">
      <Webcam intervalSecs={interval} onCapture={uploadFrame} hidden />
      <p className="monitoring__desc">Monitoring your aura . . .</p>
      <div className="progress">
        <Countdown duration={duration * 60} unit={Unit.MINUTES} />
        <p className="progress__time-remaining">remaining</p>
      </div>
      <button className="stop-btn" onClick={onStop}>
        Stop Early
      </button>
    </div>
  );
}
