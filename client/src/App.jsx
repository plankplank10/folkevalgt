import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Gallery from "./pages/gallery/Gallery";
import PersonInfo from "./pages/person-info/PersonInfo";
import Header from "./components/header/Header";

function App() {
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
