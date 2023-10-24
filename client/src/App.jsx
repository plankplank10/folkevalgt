import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Gallery from "./pages/gallery/Gallery";
import PersonInfo from "./pages/person-info/PersonInfo";
import Header from "./components/header/Header";
import { useEffect, useState } from "react";

function App() {
  const [parliamentaryPeriods, setParliamentaryPeriods] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/parliamentaryperiods")
      .then((response) => response.json())
      .then((json) => {})
      .catch((error) => console.error(error));
  });
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Gallery />}></Route>
          <Route path="/person/:personId" element={<PersonInfo />}></Route>
          <Route
            path="*"
            element={
              <div>
                <Header />
                <div className="pt-20 text-5xl font-bold">404 not found</div>
              </div>
            }
          ></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
