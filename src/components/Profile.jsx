import profilePic from "../assets/images.png";
import List from "./List";

function Card({ name, age, position }) {
  return (
    <div className="Card">
      <img src={profilePic} alt={`${name}'s profile`} />
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Position: {position}</p>

     <List />
    </div>
  );
}

export default Card;
