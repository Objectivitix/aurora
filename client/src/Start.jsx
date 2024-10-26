import { useState } from "react";
import Webcam from "./Webcam";
import {
  MAX_DURATION_MINS,
  MAX_INTERVAL_SECS,
  MIN_DURATION_MINS,
  MIN_INTERVAL_SECS,
} from "./constants";

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
              min={MIN_INTERVAL_SECS}
              max={MAX_INTERVAL_SECS}
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
              min={MIN_DURATION_MINS}
              max={MAX_DURATION_MINS}
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
