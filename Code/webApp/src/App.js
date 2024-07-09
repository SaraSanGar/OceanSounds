import React from "react";
import DetailedView from "./Pages/DetailedView/DetailedView";
import Overview from "./Pages/Overview/Overview";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/detailedview" element={<DetailedView />} />
      </Routes>
    </div>
  );
}

export default App;
