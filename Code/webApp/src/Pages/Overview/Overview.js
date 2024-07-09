import "./Overview.scss";
import DetectionsMap from "../../Components/Overview/DetectionsMap/DetectionsMap";
import Descriptors from "../../Components/Overview/Descriptors/Descriptors";
import Detecions from "../../Components/Overview/Detecions/Detecions";
import React, { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Select from "react-select";

const Overview = () => {
  const [fileData, setFileData] = useState([]);
  const [docLabels, setDocLabels] = useState(["All labels"]);
  const [docDate, setDocDate] = useState("");
  const [docName, setDocName] = useState("");
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchFiles();
    setOpenModal(true);
  }, []);

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleOpenDetailedView = () => {
    const detailedViewUrl = "/detailedview";
    window.open(detailedViewUrl, "_blank");
  };
  const handleFileChange = (selectedFileName) => {
    fetchData(selectedFileName);
  };

  const fetchFiles = async () => {
    const response = await fetch(
      "http://127.0.0.1:5000/processedData/files"
    ).catch((error) => {
      console.error("Error retrieving files:", error);
    });
    const jsonData = await response.json();
    setFileData(jsonData);
  };

  const fetchData = async (fileName) => {
    fetch("/processedData/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName: fileName }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setDocDate(data.date);
        setDocName(data.fileName);
        setDocLabels(data.labels);
      })
      .catch((error) => {
        console.error("Error retrieving data from file:", error);
      });
  };

  return (
    <>
      <div className="bodyContainer">
        <div className="header">
          <div className="docNameContainer">
            <h1>File: {docName}</h1>
            <h3>{docDate}</h3>
          </div>
          <div className="buttonContainer">
            <button
              className="otherDoc"
              height="15px"
              width="15px"
              alt="Upload another file"
              onClick={handleOpenModal}
            >
              Upload another file {">"}{" "}
            </button>
            <button
              className="detailView"
              alt="Load detail view"
              onClick={handleOpenDetailedView}
            >
              Detailed view {">"}
            </button>
          </div>
        </div>
        <div className="graphsContainer">
          <div className="graphContainer a">
            <DetectionsMap docName={docName} />
          </div>
          <div className="graphContainer b">
            <Descriptors docName={docName} labels={docLabels} />
          </div>
          <div className="graphContainer c">
            <Detecions docName={docName} />
          </div>
        </div>
      </div>
      <Modal open={openModal} onClose={handleCloseModal}>
        <div className="modalContainer">
          <h2>Upload File</h2>
          <Select
            id="selectFile"
            className="select"
            aria-labelledby="selectFile"
            onChange={(event) => {
              if (event) {
                handleFileChange(event.value);
                handleCloseModal();
              }
            }}
            options={fileData.map((data) => ({ value: data, label: data }))}
            placeholder="Choose a file"
          />
        </div>
      </Modal>
    </>
  );
};

export default Overview;
