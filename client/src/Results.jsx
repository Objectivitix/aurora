import { useState, useEffect } from "react";
import ResultsChart from "./ResultsChart";
import "./Results.css";

export default function Results({ onBackToMenu }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-data");
        const result = await response.json();
        setData(result);
      } catch (_) {
        console.error("Failed to fetch results from server.");
        setError(true);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this only runs once when the component mounts

  let desc;
  let success = false;

  if (error) {
    desc = "Uh oh -- Failed to fetch results from server!";
  } else if (!data) {
    desc = "Loading results, wait a sec ...";
  } else {
    desc = "Your results are in!";
    success = true;
  }

  const backToMenuButton = (
    <button className="back-btn" onClick={onBackToMenu}>
      Back to Menu
    </button>
  );

  return (
    <div className="body results">
      <p className="results__desc">{desc}</p>
      {success && (
        <div className="results__body">
          <ResultsChart
            times={data.neck.times}
            neckAngles={data.neck.angles}
            torsoAngles={data.torso.angles}
          />
          <div className="results__right-side">
            <div className="metric">
              <p className="metric__name">Aura</p>
              <p className="metric__body">{data.aura}</p>
            </div>
            <div className="metric">
              <p className="metric__name">Good Posture Rate</p>
              <p className="metric__body">
                {data.goodPostureRate === null
                  ? "N/A"
                  : (data.goodPostureRate * 100).toFixed(0) + " %"}
              </p>
            </div>
            {backToMenuButton}
          </div>
        </div>
      )}
      {error && backToMenuButton}
    </div>
  );
}
