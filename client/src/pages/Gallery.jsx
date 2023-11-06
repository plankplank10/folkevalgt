/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import GalleryItem from "../components/person/GalleryItem";
import Header from "../components/header/Header";
import { useNavigate, useParams } from "react-router-dom";

export default function Gallery() {
  const [personGallery, setPersonGallery] = useState(null);
  const [period, setPeriod] = useState("current");
  const navigate = useNavigate();
  const params = useParams();

  const [stortingMetadata, setStortingMetadata] = useState(null);

  const generateGallery = (data) => {
    console.log("Generating Gallery...");
    let gallery = [];
    if (data.dagens_storting)
      data.representatives.forEach((element) => {
        gallery.push(
          <GalleryItem
            key={element._id}
            personId={element._id}
            // avatarURL={element.avatarURL}
            fornavn={element.fornavn}
            etternavn={element.etternavn}
            parti={element.parti.id}
          ></GalleryItem>
        );
      });
    else
      data.representatives.forEach((element) => {
        gallery.push(
          <GalleryItem
            key={element._id}
            personId={element._id}
            // avatarURL={element.avatarURL}
            fornavn={element.fornavn}
            etternavn={element.etternavn}
            parti={element.parti.id}
          ></GalleryItem>
        );
      });
    setPersonGallery(
      <div className="flex justify-between flex-wrap">{gallery}</div>
    );
  };

  useEffect(() => {
    fetch(
      "http://localhost:3001/api/representanter" +
        (params.period == undefined ? "" : "?period=" + params.period)
    )
      .then((response) => response.json())
      .then((json) => generateGallery(json))
      .catch((error) => console.error(error));

    fetch("http://localhost:3001/api/metadata")
      .then((response) => response.json())
      .then((data) => {
        setStortingMetadata(data);
      })
      .catch((error) => console.error(error));
  }, [params]);

  let options = [];

  if (stortingMetadata)
    for (let el of stortingMetadata.stortingsperioder) {
      options.push(
        <option key={el.id} value={el.id}>
          {el.id}
        </option>
      );
    }

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
    navigate(
      "/gallery/" + (event.target.value == "current" ? "" : event.target.value)
    );
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto">
        <select name="periods" onChange={handlePeriodChange} value={period}>
          <option value="current">Dagens Storting</option>
          {options}
        </select>
        {personGallery ? personGallery : "Loading..."}
      </div>
    </div>
  );
}
