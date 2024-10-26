import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from "chartjs-plugin-zoom";
import { MIN_INTERVAL_SECS } from "./constants";
import { useRef } from "react";

const RESET_ANIMATION_DURATION = 1200;

// Register Chart.js components and the zoom plugin
Chart.register(...registerables, annotationPlugin, zoomPlugin);

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
            type: 'line',
            yMin: 18,
            yMax: 18,
            borderColor: 'rgb(54, 162, 235, 0.5)',
            borderWidth: 2,
          },
          torsoThreshold: {
            type: 'line',
            yMin: 10,
            yMax: 10,
            borderColor: 'rgb(255, 80, 132, 0.5)',
            borderWidth: 2,
          },
        }
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
    <div style={{ position: "relative", width: "min(50rem, 85vw)", aspectRatio: "16 / 9" }}>
      <button
        onClick={handleResetZoom}
        style={{
          position: "absolute",
          top: "1rem",
          right: "0.5rem",
          background: "rgba(0, 0, 0, 0.2)",
          border: "none",
          cursor: "pointer",
          padding: "0.25rem 0.5rem",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" fill="currentColor" />
        </svg>
      </button>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
