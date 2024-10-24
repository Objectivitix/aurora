import { useState, useEffect } from "react";

export default function Results({ onBackToMenu }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-data");
        const result = await response.text();
        setData(result);
      } catch (error) {
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
        {/* <Chart /> */}
        <div className="right-side">
          <div className="metric">
            <p className="metric__name">{data}</p>
            <p className="metric__body"></p>
          </div>
          <div className="metric">
            <p className="metric__name"></p>
            <p className="metric__body"></p>
          </div>
          <button className="back-btn" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
