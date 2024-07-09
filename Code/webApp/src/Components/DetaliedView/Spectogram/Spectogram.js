import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./Spectogram.scss";

const Spectrogram = ({ detectionData }) => {
  const [imgGraph, setImgGraph] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/processedData/spectrogram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ detectionData: detectionData }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch graph image");
        }
        const data = await response.json();
        setImgGraph(data.spectrogram_img);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [detectionData]);

  return (
    <div className="spectrogramContainer">
      {isLoading ? (
        <div className="loadingText">Loading data...</div>
      ) : (
        <img
          src={`data:image/png;base64,${imgGraph}`}
          className="spectogramImg"
          alt="Graph made with Python"
        />
      )}
    </div>
  );
};

Spectrogram.propTypes = {
  detectionData: PropTypes.object.isRequired,
};

export default Spectrogram;
