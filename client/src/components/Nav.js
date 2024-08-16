import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Nav.css";

const Nav = () => {
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const profilePic = localStorage.getItem("profilePicture");
    console.log("Profile Picture from localStorage:", profilePic);
    if (profilePic) {
      // Asegúrate de que la URL sea absoluta
      const absoluteUrl = `http://localhost:4000${profilePic}`;
      setProfilePicture(absoluteUrl);
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem("_id");
    localStorage.removeItem("username");
    localStorage.removeItem("profilePicture");
    navigate("/");
  };

  const username = localStorage.getItem("username");
  const userIcon = profilePicture || "/uploads/default-profile-pic.jpg";

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <nav className="navbar">
      <h2 onClick={goToDashboard} style={{ cursor: "pointer" }}>
        ByteGyals.Foro
      </h2>
      <div className="navbarRight">
        {username && (
          <div
            className="userProfile"
            onClick={goToProfile}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <img
              src={userIcon}
              alt="User Icon"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                marginRight: "10px",
              }}
            />
            <span>{username}</span>
          </div>
        )}
        <button onClick={signOut}>Cerrar sesión</button>
      </div>
    </nav>
  );
};

export default Nav;
