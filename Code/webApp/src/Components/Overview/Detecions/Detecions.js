import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import Chart from "chart.js/auto";
import "./Detecions.scss";

const Detecions = ({ docName }) => {
  const [dataArray, setDataArray] = useState([]);
  const chartInstanceRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [preparedData, setPreparedData] = useState(null);

  useEffect(() => {
    if (preparedData && dataArray.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = document.getElementById("detections");
      chartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: preparedData,
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
            },
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: "Depth (m)",
              },
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: "Number of detections",
              },
            },
          },
        },
      });
    }
  }, [preparedData, dataArray]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/processedData/detecions"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const detections = data.detections;
        setLabels(data.labels);
        const rows = detections
          .split("\n")
          .map((row) => row.trim().split(","))
          .filter((row) => row.length > 1);

        const headers = rows.shift();

        const formattedData = rows.map((row) => {
          const formattedRow = {};
          row.forEach((value, index) => {
            formattedRow[headers[index]] = value;
          });
          return formattedRow;
        });
        setDataArray(formattedData);
      } catch (error) {
        console.error("Error fetching CSV:", error);
      }
    };
    if (docName) {
      fetchData();
    }
  }, [docName]);

  useEffect(() => {
    if (dataArray.length > 0) {
      if (labels.length > 1) {
        prepareDataByLabels();
      } else {
        prepareDataByDepth();
      }
    }

    function prepareDataByDepth() {
      const detectionsPerDepth = countDetectionsPerDepthNoLabel(dataArray);
      const depths = Object.keys(detectionsPerDepth).sort((a, b) => a - b);
      const data = depths.map((depth) => detectionsPerDepth[depth]);

      setPreparedData({
        labels: depths,
        datasets: [
          {
            label: "Detections",
            data: data,
            backgroundColor: "#0b199e",
            borderWidth: 1,
          },
        ],
      });
    }

    function prepareDataByLabels() {
      const detectionsPerDepth = countDetectionsPerDepth(dataArray);
      const uniqueLabelsArray = uniqueLabels(dataArray);
      const datasets = [];
      const colors = ["#cc0a0a", "#e76b14", "#9cdf04", "#46AFBD", "#F9DB77"];
      let i = 0;

      for (const type in detectionsPerDepth) {
        const data = [];
        uniqueLabelsArray.forEach((label) => {
          const count = detectionsPerDepth[type][label] || 0;
          data.push(count);
        });

        datasets.push({
          label: type,
          data: data,
          backgroundColor: colors[i],
          borderWidth: 1,
        });
        i++;
      }

      setPreparedData({
        labels: [...uniqueLabelsArray],
        datasets: datasets,
      });
    }
  }, [dataArray, dataArray.length, labels]);

  function uniqueLabels(dataArray) {
    const uniqueLabels = new Set();

    dataArray.forEach((data) => {
      uniqueLabels.add(Number.parseFloat(data.depth).toFixed(0));
    });

    return [...uniqueLabels];
  }

  function countDetectionsPerDepth(dataArray) {
    const detectionsPerDepth = {};

    dataArray.forEach((data) => {
      if (!detectionsPerDepth[data.label]) {
        detectionsPerDepth[data.label] = {};
      }

      const depth = Number.parseFloat(data.depth).toFixed(0);
      if (!detectionsPerDepth[data.label][depth]) {
        detectionsPerDepth[data.label][depth] = 0;
      }

      detectionsPerDepth[data.label][depth]++;
    });
    return detectionsPerDepth;
  }

  function countDetectionsPerDepthNoLabel(dataArray) {
    const detectionsPerDepth = {};

    dataArray.forEach((data) => {
      const depth = Number.parseFloat(data.depth).toFixed(0);
      if (!detectionsPerDepth[depth]) {
        detectionsPerDepth[depth] = 0;
      }
      detectionsPerDepth[depth]++;
    });

    return detectionsPerDepth;
  }

  return (
    <>
      <div className="container">
        <div className="sub-header">
          <h2>Number of detections</h2>
        </div>
        <canvas id="detections"></canvas>
      </div>
    </>
  );
};

Detecions.propTypes = {
  docName: PropTypes.string.isRequired,
};

export default Detecions;
