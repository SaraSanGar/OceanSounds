import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./Descriptors.scss";

const Descriptors = ({ docName, labels }) => {
  const [dataArray, setDataArray] = useState([]);
  const [label, setLabel] = useState("");

  const handleLabelChange = (event) => {
    const selectedLabel = event.target.value;
    setLabel(selectedLabel);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Corrección aquí: Asegúrate de que la URL esté entre comillas
        const response = await fetch(
          `http://127.0.0.1:5000/processedData/descriptors?label=${label}`
        );
        const textData = await response.text();

        const rows = textData
          .slice(1)
          .split("\\n")
          .map((row) => row.trim().split(","));
        rows.pop();
        const headers = rows.shift();

        const formattedData = rows.map((row) => {
          const formattedRow = {};
          row.forEach((value, index) => {
            formattedRow[headers[index]] = value;
          });
          return formattedRow;
        });
        setDataArray(
          formattedData.map((row) => {
            let descriptor = row.Descriptor.includes("[")
              ? row.Descriptor.replace(/\[(.*?)\]/, " [$1]").trim()
              : row.Descriptor;
            return { ...row, Descriptor: descriptor };
          })
        );
        const roundedData = formattedData.map((row) => {
          const roundedRow = {};
          Object.entries(row).forEach(([key, value]) => {
            roundedRow[key] = isNaN(parseFloat(value))
              ? value
              : parseFloat(value).toFixed(3);
          });
          return roundedRow;
        });

        setDataArray(roundedData);
      } catch (error) {
        console.error("Error fetching CSV:", error);
      }
    };
    if (label) {
      fetchData();
    }
  }, [label]);

  useEffect(() => {
    setLabel("");
    setDataArray([]);
  }, [docName]);

  return (
    <div className="descriptorsContainer">
      <div className="descriptorHeader">
        <h2>Descriptors</h2>
        <select
          id="selectDescriptor"
          className="selectDescriptor"
          onChange={handleLabelChange}
          value={label}
        >
          {!label && <option value="">Choose a label</option>}
          {labels?.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="tableContainer">
        <Table>
          <Thead>
            <Tr>
              <Th>Descriptors</Th>
              <Th>Mean</Th>
              <Th>SD</Th>
              <Th>Median</Th>
              <Th>
                Percentile<sub>10</sub>
              </Th>
              <Th>
                Percentile<sub>90</sub>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {dataArray.length > 0 &&
              dataArray.map((row) => (
                <Tr key={row.Descriptor}>
                  <Td>{row.Descriptor}</Td>
                  <Td>{row.Mean}</Td>
                  <Td>{row.SD}</Td>
                  <Td>{row.Median}</Td>
                  <Td>{row.Percentile10}</Td>
                  <Td>{row.Percentile90}</Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
};

Descriptors.propTypes = {
  docName: PropTypes.string.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Descriptors;
