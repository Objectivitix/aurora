import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import { MIN_INTERVAL_SECS } from "./constants";
import { useRef } from "react";
import homeIcon from "./assets/home.svg";
import "./ResultsChart.css";

const RESET_ANIMATION_DURATION = 1200;

// Register Chart.js components and the zoom plugin
Chart.register(...registerables, annotationPlugin, zoomPlugin);

Chart.defaults.font.family = "Lato";

export default function ResultsChart({ times, neckAngles, torsoAngles }) {
  const chartRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  function handleResetZoom() {
    chartRef.current.options.plugins.zoom.zoom.wheel.enabled = false;
    chartRef.current.options.plugins.zoom.zoom.pinch.enabled = false;
    chartRef.current.update();

    chartRef.current.resetZoom();

    clearTimeout(resetTimeoutRef.current);

    resetTimeoutRef.current = setTimeout(() => {
      chartRef.current.options.plugins.zoom.zoom.wheel.enabled = true;
      chartRef.current.options.plugins.zoom.zoom.pinch.enabled = true;
      chartRef.current.update();
    }, RESET_ANIMATION_DURATION);
  }

  const data = {
    labels: times,
    datasets: [
      {
        label: "Neck",
        data: neckAngles,
        // fill: false,
        // backgroundColor: 'rgba(75,192,192,0.2)',
        // borderColor: 'rgba(75,192,192,1)',
        pointHitRadius: 5,
        pointHoverRadius: 5,
      },
      {
        label: "Torso",
        data: torsoAngles,
        // fill: false,
        // backgroundColor: 'rgba(75,192,192,0.2)',
        // borderColor: 'rgba(75,192,192,1)',
        pointHitRadius: 5,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    interaction: {
      intersect: true,
      mode: "index",
    },
    spanGaps: true,
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Time (s)",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Angle (°)",
        },
      },
    },
    plugins: {
      annotation: {
        annotations: {
          neckThreshold: {
            type: "line",
            yMin: 18,
            yMax: 18,
            borderColor: "rgb(54, 162, 235, 0.5)",
            borderWidth: 2,
          },
          torsoThreshold: {
            type: "line",
            yMin: 10,
            yMax: 10,
            borderColor: "rgb(255, 80, 132, 0.5)",
            borderWidth: 2,
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "xy",
        },
        zoom: {
          wheel: {
            enabled: true, // Enable zooming with the mouse wheel
          },
          pinch: {
            enabled: true, // Enable zooming with pinch gestures on touch devices
          },
          mode: "xy",
        },
        limits: {
          x: {
            min: 0,
            max: times[times.length - 1],
            minRange: MIN_INTERVAL_SECS * 2,
          },
          y: { min: 0, max: 120, minRange: 2 },
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => `t=${items[0].label} seconds`,
          label: (item) => ` ${item.dataset.label}: ${item.raw.toFixed(1)}°`,
        },
      },
    },
  };

  return (
    <div className="chart">
      <button className="chart__reset-zoom" onClick={handleResetZoom}>
        <img src={homeIcon} alt="" />
      </button>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
