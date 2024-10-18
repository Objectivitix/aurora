import { useState, useRef } from "react";

export default function Proof() {
  const firstTime = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [neckAngle, setNeckAngle] = useState(null);
  const [torsoAngle, setTorsoAngle] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [everything, setEverything] = useState("");

  // Handle file selection
  const handleFileChange = (evt) => {
    setSelectedFile(evt.target.files[0]);
    setErrorMessage("");
  };

  // Handle form submission (upload the file)
  const handleSubmit = async (evt) => {
    evt.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Please select an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    if (firstTime.current == null) {
      firstTime.current = Math.floor(Date.now() / 1000);
    }

    formData.append("time", Math.floor(Date.now() / 1000) - firstTime.current);

    try {
      const response = await fetch("http://localhost:5000/submit-frame", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.status === 201) {
        setNeckAngle(data.neckAngle);
        setTorsoAngle(data.torsoAngle);
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "Error analyzing posture.");
        setNeckAngle(null);
        setTorsoAngle(null);
      }
    } catch (_) {
      setErrorMessage("Failed to upload the image.");
    }
  };

  return (
    <>
      <h1>Posture Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit">Analyze Posture</button>
      </form>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {neckAngle !== null && torsoAngle !== null && (
        <div>
          <p>Neck Angle: {neckAngle.toFixed(2)}°</p>
          <p>Torso Angle: {torsoAngle.toFixed(2)}°</p>
        </div>
      )}

      {everything !== "" && <p>{everything}</p>}

      <button
        onClick={async () => {
          try {
            const response = await fetch("http://localhost:5000/get-data");
            const data = await response.text();

            if (response.status === 200) {
              setNeckAngle(null);
              setTorsoAngle(null);
              setErrorMessage("");
              setEverything(data);
            } else {
              setErrorMessage("Something went wrong.");
              setNeckAngle(null);
              setTorsoAngle(null);
            }
          } catch (_) {
            setErrorMessage("Something went wrong, part 2.");
          }
        }}
      >
        All The Data, Please
      </button>

      <button
        onClick={async () => {
          try {
            const response = await fetch("http://localhost:5000/new-session", {
              method: "POST",
            });

            if (response.status === 201) {
              firstTime.current = null;
              setEverything("New monitoring session started.");
            } else {
              setErrorMessage("Failed to start new session.");
            }
          } catch (_) {
            setErrorMessage("Error: Could not connect to the server.");
          }
        }}
      >
        Start New Session
      </button>
    </>
  );
}
