import { useState } from "react";
import Webcam from "./Webcam";
import {
  MAX_DURATION_MINS,
  MAX_INTERVAL_SECS,
  MIN_DURATION_MINS,
  MIN_INTERVAL_SECS,
} from "./constants";
import "./Start.css";

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
    <div className="body start">
      <p className="start__tagline">Charismatic programming for everyone.</p>
      <div className="start__body">
        <div className="webcam-ctnr">
          <p className="webcam-ctnr__tip">
            Align camera to side profile and ensure body is wholly visible for
            best results.
          </p>
          <Webcam intervalSecs={-1} />
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="interval">
              Interval
            </label>
            <div className="field__body">
              <input
                className="field__input"
                type="number"
                id="interval"
                min={MIN_INTERVAL_SECS}
                max={MAX_INTERVAL_SECS}
                value={interv}
                onChange={handleIntervalChange}
              />
              <p className="field__units">secs</p>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="duration">
              Duration
            </label>
            <div className="field__body">
              <input
                className="field__input"
                type="number"
                id="duration"
                min={MIN_DURATION_MINS}
                max={MAX_DURATION_MINS}
                value={duration}
                onChange={handleDurationChange}
              />
              <p className="field__units">mins</p>
            </div>
          </div>
          <div className="start-btn-wrapper">
            <button type="submit" className="start-btn">
              Start Monitoring
            </button>
          </div>
        </form>
        <p className="footer">Calo's ICS4U 24-25 #3</p>
      </div>
    </div>
  );
}
