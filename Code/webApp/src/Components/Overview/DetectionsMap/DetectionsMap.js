import "leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.src.js";
import "leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css";
import { FormControlLabel, FormGroup } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import optionsIcon from "../../../Icons/options.svg";
import Checkbox from "@mui/material/Checkbox";
import Modal from "@mui/material/Modal";
import PropTypes from "prop-types";
import "leaflet/dist/leaflet.css";
import "./DetectionsMap.scss";
import L from "leaflet";

const DetectionsMap = ({ docName }) => {
  const [mapStyle, setMapStyle] = useState("batimetry");
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);
  const mapInstance = useRef(null);
  const mapRef = useRef(null);

  const handleCheckboxChange = (style) => {
    setMapStyle(style);
  };

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        attributionControl: false,
        minZoom: 5,
        zoomControl: false,
      }).setView([27.9653, -15.5899], 8);

      L.control.zoom({ position: "topright" }).addTo(mapInstance.current);

      L.control
        .scale({ position: "bottomleft", metrical: false, maxWidth: 200 })
        .addTo(mapInstance.current);

      L.control
        .coordinates({
          position: "bottomright",
          decimals: 2,
          decimalSeperator: ".",
          labelTemplateLat: "Latitude: {y}",
          labelTemplateLng: "Longitude: {x}",
          enableUserInput: true,
          useDMS: false,
          useLatLngOrder: true,
          markerType: L.marker,
          markerProps: {},
          labelFormatterLng: function (lng) {
            return lng + " lng";
          },
          labelFormatterLat: function (lat) {
            return lat + " lat";
          },
          customLabelFcn: function (latLonObj, opts) {
            return (
              "Lat: " +
              latLonObj.lat.toFixed(2) +
              ", Lng: " +
              latLonObj.lng.toFixed(2)
            );
          },
        })
        .addTo(mapInstance.current);
    }

    mapInstance.current.eachLayer((layer) => {
      mapInstance.current.removeLayer(layer);
    });

    if (mapInstance.current) {
      if (mapStyle === "standard") {
        L.tileLayer
          .wms(
            "https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0",
            {
              layers: "emodnet:mean_atlas_land",
            }
          )
          .addTo(mapInstance.current);
      } else {
        L.tileLayer
          .wms(
            "https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0",
            {
              layers:
                "emodnet:mean_atlas_land,emodnet:mean_rainbowcolour,emodnet:contours",
            }
          )
          .addTo(mapInstance.current);
      }
    }

    const fetchData = async () => {
      try {
        if (!docName) {
          return null;
        }
        const response = await fetch("http://127.0.0.1:5000/processedData/map");
        const textData = await response.text();

        const rows = textData.split("\\n").map((row) => row.trim().split(","));
        rows.pop();
        const headers = rows.shift();
        const formattedData = rows.map((row) => {
          const formattedRow = {};
          for (let index = 1; index < headers.length; index++) {
            formattedRow[headers[index]] = parseFloat(row[index]);
          }
          return formattedRow;
        });

        const polylineOptions = {
          color: "#d3d3d3",
        };
        const pointOptions = {
          color: "red",
          fillColor: "red",
          fillOpacity: 1,
          radius: 5,
        };

        const polylinePoints = formattedData.map((point) => [
          point.lat,
          point.lon,
        ]);
        const polyline = L.polyline(polylinePoints, polylineOptions).addTo(
          mapInstance.current
        );

        formattedData.forEach((point) => {
          L.circleMarker([point.lat, point.lon], pointOptions).addTo(
            mapInstance.current
          );
        });

        mapInstance.current.fitBounds(polyline.getBounds());
      } catch (error) {
        console.error("Error fetching CSV:", error);
      }
    };

    fetchData();
  }, [mapStyle, docName]);

  return (
    <>
      <div className="container">
        <div className="mapHeader">
          <h2>Map</h2>
          <button className="options" onClick={handleOpen}>
            <img
              className="options"
              src={optionsIcon}
              alt="Botón opciones del mapa"
            />
          </button>
        </div>

        <div id="map" ref={mapRef}></div>
      </div>
      <Modal open={open} onClose={handleClose}>
        <div className="modalContainer">
          <h2>Map Options</h2>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mapStyle === "batimetry"}
                  onChange={() => handleCheckboxChange("batimetry")}
                />
              }
              label="Bathymetric"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={mapStyle === "standard"}
                  onChange={() => handleCheckboxChange("standard")}
                />
              }
              label="Standard"
            />
          </FormGroup>
        </div>
      </Modal>
    </>
  );
};

DetectionsMap.propTypes = {
  docName: PropTypes.string.isRequired,
};

export default DetectionsMap;
