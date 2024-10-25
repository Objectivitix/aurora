import { useState, useEffect } from "react";
import ResultsChart from "./ResultsChart";

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

  if (error) {
    return <div>Uh oh -- Failed to fetch results from server!</div>;
  }

  if (!data) {
    return <div>Loading results, wait a sec ...</div>; // Show loading state until data is fetched
  }

  return (
    <div>
      <p className="desc">Your results are in!</p>
      <div className="main">
        <ResultsChart
          times={data.neck.times}
          neckAngles={data.neck.angles}
          torsoAngles={data.torso.angles}
        />
        <div className="right-side">
          <div className="metric">
            <p className="metric__name">Aura</p>
            <p className="metric__body">{data.aura}</p>
          </div>
          <div className="metric">
            <p className="metric__name">Good Posture Rate</p>
            <p className="metric__body">
              {data.goodPostureRate === null
                ? "N/A"
                : (data.goodPostureRate * 100).toFixed(0) + "%"}
            </p>
          </div>
          <button className="back-btn" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
