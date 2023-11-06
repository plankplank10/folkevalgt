/* eslint-disable react/prop-types */
import "./GalleryItem.css";
import { Link } from "react-router-dom";

const GalleryItem = (props) => {
  return (
    <Link to={"/person/" + props.element._id}>
      <div className="person-avatar">
        <div className="person-avatar-img-wrapper">
          <img className="person-avatar-img" src={props.avatarURL}></img>
        </div>
        <p>
          {props.fornavn +
            " " +
            props.etternavn +
            " (" +
            props.element.parti.id +
            ")"}
        </p>
      </div>
    </Link>
  );
};

export default GalleryItem;
