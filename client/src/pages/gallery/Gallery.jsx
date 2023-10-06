import { useEffect, useState } from "react";
import GalleryItem from "../../components/person/GalleryItem";
import "./Gallery.css";
import Header from "../../components/header/Header";

export default function Gallery() {
  const [personGallery, setPersonGallery] = useState(null);

  const generateGallery = (data) => {
    let gallery = [];
    data.forEach((element) => {
      gallery.push(
        <GalleryItem
          element={element}
          avatarURL={element.avatarURL}
          fornavn={element.fornavn}
          etternavn={element.etternavn}
        ></GalleryItem>
      );
    });
    setPersonGallery(<div className="person-gallery">{gallery}</div>);
  };

  useEffect(() => {
    fetch("http://192.168.86.22:3001/api/folkevalgte")
      .then((response) => response.json())
      .then((json) => generateGallery(json))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
      <Header />
      <div className="container mx-auto pt-14">
        {personGallery ? personGallery : "Loading..."}
      </div>
    </div>
  );
}
