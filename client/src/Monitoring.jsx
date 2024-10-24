import { useEffect } from "react";
import Countdown, { Unit } from "./Countdown";
import Webcam from "./Webcam";

export default function Monitoring({ interval, duration, onStop }) {
  useEffect(() => {
    const timeout = setTimeout(onStop, duration * 60 * 1000 + 2000);

    return () => clearTimeout(timeout);
  }, []);

  async function uploadFrame(file, time) {
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
  }

  return (
    <div>
      <Webcam intervalSecs={interval} onCapture={uploadFrame} hidden />
      <p className="desc">Monitoring your aura . . .</p>
      <div>
        <Countdown duration={duration * 60} unit={Unit.MINUTES} />
        <p className="remaining">remaining</p>
      </div>
      <button className="stop-btn" onClick={onStop}>
        Stop Early
      </button>
    </div>
  );
}
