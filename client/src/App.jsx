import { useState } from "react";
import "./App.css";
import Start from "./Start";
import Monitoring from "./Monitoring";
import Results from "./Results";
import { BACKEND } from "./constants";

export default function App() {
  const [state, setState] = useState("start");
  const [monitorInterval, setMonitorInterval] = useState(null);
  const [monitorDuration, setMonitorDuration] = useState(null);

  async function handleStart(interval, duration) {
    setMonitorInterval(interval);
    setMonitorDuration(duration);
    setState("monitoring");

    try {
      await fetch(`${BACKEND.prefix}/new-session`, {
        method: "POST",
      });
    } catch (_) {
      console.error("Failed to make server begin new session.");
    }
  }

  return (
    <>
      <h1>Aurora</h1>
      {state === "start" && <Start onStart={handleStart} />}
      {state === "monitoring" && (
        <Monitoring
          interval={monitorInterval}
          duration={monitorDuration}
          onStop={() => setState("results")}
        />
      )}
      {state === "results" && (
        <Results onBackToMenu={() => setState("start")} />
      )}
    </>
  );
}
