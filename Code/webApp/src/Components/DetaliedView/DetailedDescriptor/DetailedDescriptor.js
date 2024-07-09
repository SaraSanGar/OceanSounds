import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import PropTypes from "prop-types";
import "./DetailedDescriptor.scss";

const DetailedDescriptor = ({ detectionData }) => {
  const dataArray = Object.keys(detectionData)
    .filter((key) => key !== "Id")
    .map((key) => {
      let value = detectionData[key];
      let measure = key.match(/\[(.*?)\]/);
      let descriptor = key.includes("[")
        ? key.replace(/\[(.*?)\]/, " " + measure[0]).trim()
        : key;
      return {
        Descriptor: descriptor,
        Valor: value,
      };
    });
  dataArray.forEach((row) => {
    if (typeof row.Valor === "number") {
      row.Valor = row.Valor.toFixed(3);
    }
  });

  return (
    <div className="descriptorsContainer">
      <div className="descriptorHeader">
        <h2>Descriptors</h2>
      </div>
      <div className="tableContainer">
        <Table>
          <Thead>
            <Tr>
              <Th>Descriptors</Th>
              <Th>Values</Th>
            </Tr>
          </Thead>
          <Tbody>
            {dataArray.map((row) => (
              <Tr key={row.Descriptor}>
                <Td>{row.Descriptor}</Td>
                <Td>{row.Valor}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
};

DetailedDescriptor.propTypes = {
  detectionData: PropTypes.object.isRequired,
};

export default DetailedDescriptor;
