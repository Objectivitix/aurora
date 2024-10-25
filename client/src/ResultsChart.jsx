import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

// Register Chart.js components and the zoom plugin
Chart.register(...registerables, zoomPlugin);

export default function ResultsChart({ times, neckAngles, torsoAngles }) {
  const data = {
    labels: times,
    datasets: [
      {
        label: "Neck",
        data: neckAngles,
        // fill: false,
        // backgroundColor: 'rgba(75,192,192,0.2)',
        // borderColor: 'rgba(75,192,192,1)',
      },
      {
        label: "Torso",
        data: torsoAngles,
        // fill: false,
        // backgroundColor: 'rgba(75,192,192,0.2)',
        // borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const options = {
    spanGaps: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true, // Enable zooming with the mouse wheel
          },
          pinch: {
            enabled: true, // Enable zooming with pinch gestures on touch devices
          },
          mode: "x",
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", width: "50vw" }}>
      <Line data={data} options={options} />
    </div>
  );
}
