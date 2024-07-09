import DetailedDescriptor from "../../Components/DetaliedView/DetailedDescriptor/DetailedDescriptor";
import DetailedMap from "../../Components/DetaliedView/DetailedMap/DetailedMap";
import Spectogram from "../../Components/DetaliedView/Spectogram/Spectogram";
import AudioSignal from "../../Components/DetaliedView/AudioSignal/AudioSignal";
import React, { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Select from "react-select";
import "./DetailedView.scss";

const DetailedView = () => {
  const [openModal, setOpenModal] = useState(false);
  const [detectionData, setDetectionData] = useState(null); // Set initial state to null
  const [maxDetections, setMaxDetections] = useState(0);
  const [fileData, setFileData] = useState([]);
  const [docName, setDocName] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docTime, setDocTime] = useState("");

  useEffect(() => {
    fetchFiles();
    setOpenModal(true);
  }, []);

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);

  const handleDataBefore = async () => {
    const selectedFileName = detectionData?.Id;
    if (selectedFileName && selectedFileName - 1 >= 1) {
      await fetchData(selectedFileName - 1);
    }
  };

  const handleDataAfter = async () => {
    const selectedFileName = detectionData?.Id;
    if (selectedFileName && selectedFileName + 1 <= maxDetections) {
      await fetchData(selectedFileName + 1);
    }
  };

  const handleFileChange = async (selectedFileName) => {
    await fetchData(selectedFileName);
  };

  const fetchData = async (detectionName) => {
    try {
      const response = await fetch("/processedDetection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ detectionName: detectionName }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setDocDate(data.date);
      setDocName(data.fileName);
      setDocTime(data.time);
      setDetectionData(data.detectionData);
    } catch (error) {
      console.error("Error al recuperar los datos del archivo:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/processedDetection/all_detections"
      );
      const jsonData = await response.json();
      setFileData(jsonData);
      setMaxDetections(jsonData.length);
    } catch (error) {
      console.error("Error al recuperar los archivos:", error);
    }
  };

  return (
    <>
      <div className="bodyContainer">
        <div className="header">
          <div className="docNameContainer">
            <h1>File: {docName}</h1>
            <h3>
              {docDate} {docTime}
            </h3>
          </div>
          <div className="buttonContainer">
            <button
              className="otherFile"
              alt="Open another detection"
              onClick={handleOpenModal}
            >
              Open another detection
            </button>
            <button
              className="fileBefore"
              alt="Previous file"
              onClick={handleDataBefore}
            >
              {"<"}
            </button>
            <button
              className="fileAfter"
              alt="Next file"
              onClick={handleDataAfter}
            >
              Next detection {">"}
            </button>
          </div>
        </div>
        <div className="graphsContainerDetailed">
          <div className="graphContainer a--detailed">
            {detectionData && <DetailedMap detectionData={detectionData} />}
          </div>
          <div className="graphContainer b--detailed">
            {detectionData && (
              <DetailedDescriptor detectionData={detectionData} />
            )}
          </div>
          <div className="graphContainer c--detailed">
            {detectionData && <Spectogram detectionData={detectionData} />}
          </div>
          <div className="graphContainer d--detailed">
            {detectionData && <AudioSignal detectionData={detectionData} />}
          </div>
        </div>
      </div>

      <Modal open={openModal} onClose={handleCloseModal}>
        <div className="modalContainer">
          <h2>Load detection</h2>
          <Select
            id="selectFile"
            className="select"
            onChange={(selectedOption) => {
              if (selectedOption) {
                handleFileChange(selectedOption.value);
                handleCloseModal();
              }
            }}
            options={fileData.map((data) => ({ value: data, label: data }))}
            placeholder="Choose a detection"
          />
        </div>
      </Modal>
    </>
  );
};

export default DetailedView;
