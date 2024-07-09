import { FormControlLabel, FormGroup } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import optionsIcon from "../../../Icons/options.svg";
import locationIcon from "../../../Icons/location_dot_red.svg";
import Checkbox from "@mui/material/Checkbox";
import Modal from "@mui/material/Modal";
import PropTypes from "prop-types";
import "leaflet/dist/leaflet.css";
import "./DetailedMap.scss";
import L from "leaflet";

const DetailedMap = ({ detectionData }) => {
  const [mapStyle, setMapStyle] = useState("batimetry");
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [depth, setDepth] = useState(0);
  const [status, setStatus] = useState(0);
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
        .scale({ position: "bottomleft", metric: false, maxWidth: 200 })
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

    function getStatusDescription(detectionData) {
      switch (detectionData["state"]) {
        case 105:
          detectionData["state"] = "Initializing";
          break;
        case 115:
          detectionData["state"] = "Surfacing";
          break;
        case 119:
          detectionData["state"] = "GPS";
          break;
        case 116:
          detectionData["state"] = "Transmitting";
          break;
        case 110:
          detectionData["state"] = "Inflecting down";
          break;
        case 100:
          detectionData["state"] = "Diving";
          break;
        case 118:
          detectionData["state"] = "Inflection up";
          break;
        case 117:
          detectionData["state"] = "Climbing";
          break;
        case 120:
          detectionData["state"] = "Landing maneuver";
          break;
        case 121:
          detectionData["state"] = "Bottom landing";
          break;
        case 122:
          detectionData["state"] = "Taking off";
          break;
        case 123:
          detectionData["state"] = "Ballasting";
          break;
        case 124:
          detectionData["state"] = "Drifting";
          break;
        default:
          break;
      }
      return detectionData;
    }

    const fetchData = async () => {
      try {
        if (
          !detectionData ||
          typeof detectionData["lon[deg]"] === "undefined" ||
          typeof detectionData["lat[deg]"] === "undefined"
        ) {
          return null;
        }
        setLon(detectionData["lon[deg]"]);
        setLat(detectionData["lat[deg]"]);
        setDepth(detectionData["depth[m]"]);
        getStatusDescription(detectionData);
        setStatus(detectionData["state"]);

        const photoIcon = L.icon({
          iconUrl: locationIcon,
          iconSize: [10, 10],
        });

        L.marker([lat, lon], { icon: photoIcon })
          .addTo(mapInstance.current)
          .bindPopup(`Depth: ${depth.toFixed(2)} m <br> Status: ${status}`)
          .openPopup();
      } catch (error) {
        console.error("Error fetching detection data:", error);
      }
    };

    fetchData();
  }, [mapStyle, detectionData, depth, lat, lon, status]);

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

DetailedMap.propTypes = {
  detectionData: PropTypes.object.isRequired,
};

export default DetailedMap;
