import { useEffect, useState } from "react";
import "./Countdown.css";

// Define the enum for units
export const Unit = {
  SECONDS: Symbol("seconds"),
  MINUTES: Symbol("minutes"),
  HOURS: Symbol("hours"),
};

function getConversionFactor(unit) {
  switch (unit) {
    case Unit.MINUTES:
      return 60;
    case Unit.HOURS:
      return 3600;
    default:
      return 1;
  }
}

function getUnitString(seconds, unit) {
  const formatted = formatTime(seconds, unit);

  const base =
    unit === Unit.MINUTES ? "min" : unit === Unit.HOURS ? "hr" : "sec";

  return base + (formatted === "1" ? "" : "s");
}

function formatTime(seconds, unit) {
  const conversionFactor = getConversionFactor(unit);
  return (seconds / conversionFactor).toFixed(0); // Keep it with two decimals if needed
}

export default function Countdown({ duration, unit }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      return; // Stop countdown if time reaches zero
    }

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(interval); // Clean up the interval on unmount
  }, [timeLeft]);

  return (
    <div className="countdown">
      <p className="countdown__time">{formatTime(timeLeft, unit)}</p>
      <p className="countdown__unit">{getUnitString(timeLeft, unit)}</p>
    </div>
  );
}
