import { useState } from "react";
import Webcam from "./Webcam";

export default function Start({ onStart }) {
  const [interv, setInterv] = useState(60);
  const [duration, setDuration] = useState(30);

  function handleIntervalChange(evt) {
    setInterv(evt.target.valueAsNumber);
  }

  function handleDurationChange(evt) {
    setDuration(evt.target.valueAsNumber);
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    onStart(interv, duration);
  }

  return (
    <div>
      <p className="tagline">Charismatic programming for everyone.</p>
      <p className="desc">
        Align camera to side profile and ensure body is wholly visible for best
        results.
      </p>
      <div className="main">
        <Webcam intervalSecs={-1} />
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="interval">Interval</label>
            <input
              type="number"
              id="interval"
              min="3"
              max="600"
              value={interv}
              onChange={handleIntervalChange}
            />
            <p className="units">secs</p>
          </div>
          <div className="field">
            <label htmlFor="duration">Duration</label>
            <input
              type="number"
              id="duration"
              min="1"
              max="600"
              value={duration}
              onChange={handleDurationChange}
            />
            <p className="units">mins</p>
          </div>
          <button type="submit" className="start-btn">
            Start Monitoring
          </button>
        </form>
      </div>
    </div>
  );
}
