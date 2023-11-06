import { useEffect, useState } from "react";
import Header from "../components/header/Header";
import GalleryItem from "../components/person/GalleryItem";

export default function Regjering() {
  const [regjering, setRegjering] = useState(null);

  const generateRegjering = (list) => {
    if (list == null) return null;
    let statsminister = list.find((el) => el.sortering == 1);

    setRegjering(
      <GalleryItem
        key={statsminister._id}
        personId={statsminister._id}
        fornavn={statsminister.fornavn}
        etternavn={statsminister.etternavn}
        parti={statsminister.parti._id}
      />
    );
  };

  useEffect(() => {
    fetch("http://localhost:3001/api/regjering")
      .then((response) => response.json())
      .then((json) => generateRegjering(json.list))
      .catch((error) => console.error(error));
  });
  return (
    <div>
      <Header />
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold">Regjering</h1>
        {regjering != null ? regjering : "Loading..."}
      </div>
    </div>
  );
}
