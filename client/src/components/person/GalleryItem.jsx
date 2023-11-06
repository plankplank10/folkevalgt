/* eslint-disable react/prop-types */
import "./GalleryItem.css";
import { Link } from "react-router-dom";

const GalleryItem = (props) => {
  let avatarURL =
    props.avatarURL != undefined
      ? props.avatarURL
      : "https://data.stortinget.no/eksport/personbilde?personid=" +
        props.personId +
        "&storrelse=middels&erstatningsbilde=true";
  return (
    <Link to={"/person/" + props.personId}>
      <div className="person-avatar">
        <div className="person-avatar-img-wrapper">
          <img className="person-avatar-img" src={avatarURL}></img>
        </div>
        <p>
          {props.fornavn + " " + props.etternavn + " (" + props.parti + ")"}
        </p>
      </div>
    </Link>
  );
};

export default GalleryItem;
