import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Proof from "./Proof";
import Start from "./Start";
import Monitoring from "./Monitoring";
import Results from "./Results";

export default function App() {
  const [state, setState] = useState("results");
  const [monitorInterval, setMonitorInterval] = useState(null);
  const [monitorDuration, setMonitorDuration] = useState(null);

  async function handleStart(interval, duration) {
    setMonitorInterval(interval);
    setMonitorDuration(duration);
    setState("monitoring");

    try {
      await fetch("http://localhost:5000/new-session", {
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
      {/* <Proof /> */}
    </>
  );
}
