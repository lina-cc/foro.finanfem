import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import "./Profile.css";

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false); // Nuevo estado para controlar el modo de edición
  const [newDescription, setNewDescription] = useState("");
  const [newProfilePicture, setNewProfilePicture] = useState(null); // Estado para la nueva imagen
  const userId = localStorage.getItem("_id");

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:4000/api/user/${userId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setUserDetails(data.user);
          setNewDescription(data.user.description);
        })
        .catch((err) => {
          console.error(err);
          alert(`Error fetching user details: ${err.message}`);
        });

      fetch(`http://localhost:4000/api/user/${userId}/posts`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setUserPosts(data.posts);
        })
        .catch((err) => {
          console.error(err);
          alert(`Error fetching user posts: ${err.message}`);
        });
    } else {
      console.error("User ID not found in localStorage");
    }
  }, [userId]);

  const handleDescriptionChange = (e) => {
    setNewDescription(e.target.value);
  };

  const handleProfilePictureChange = (e) => {
    setNewProfilePicture(e.target.files[0]); // Guardar la imagen seleccionada
  };

  const saveDescription = () => {
    fetch(`http://localhost:4000/api/user/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: newDescription }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error_message) {
          alert(data.error_message);
        } else {
          alert(data.message);
          setUserDetails(data.user);
          setEditingDescription(false);
        }
      })
      .catch((err) => {
        console.error(err);
        alert(`Error updating description: ${err.message}`);
      });
  };

  const saveProfilePicture = () => {
    if (!newProfilePicture) {
      alert("Por favor selecciona una imagen primero.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", newProfilePicture);

    fetch(`http://localhost:4000/api/user/${userId}/upload-picture`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error_message) {
          alert(data.error_message);
        } else {
          alert(data.message);
          setUserDetails(data.user);
          localStorage.setItem(
            "profilePicture",
            `http://localhost:4000${data.user.profilePicture}`
          ); // Guardar la URL en localStorage
        }
      })
      .catch((err) => {
        console.error(err);
        alert(`Error uploading profile picture: ${err.message}`);
      });
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Nav />
      <div className="profile">
        <div className="profileHeader">
          {editingProfile && (
            <button
              className="finishEditButton"
              onClick={() => setEditingProfile(false)}
            >
              Terminar edición
            </button>
          )}
          <img
            src={`http://localhost:4000${userDetails.profilePicture}`}
            alt="Profile"
            style={{ width: "300px", height: "300px", borderRadius: "50%" }}
          />
          <h1>{userDetails.displayName}</h1>
          <h2>@{userDetails.username}</h2>

          {/* Asegurarse de que la descripción se muestre */}
          {!editingDescription && <p>{userDetails.description}</p>}

          {!editingProfile ? (
            <button onClick={() => setEditingProfile(true)}>
              Editar perfil
            </button>
          ) : (
            <>
              <label htmlFor="fileInput" className="customFileUpload">
                Seleccionar archivo
              </label>
              <input
                id="fileInput"
                type="file"
                onChange={handleProfilePictureChange}
                className="fileInput"
              />
              <button onClick={saveProfilePicture}>Subir Foto</button>
              {editingDescription ? (
                <>
                  <textarea
                    value={newDescription}
                    onChange={handleDescriptionChange}
                    rows={3}
                  />
                  <button onClick={saveDescription}>Guardar</button>
                  <button onClick={() => setEditingDescription(false)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <p>{userDetails.description}</p>
                  <button onClick={() => setEditingDescription(true)}>
                    Editar Descripción
                  </button>
                </>
              )}
            </>
          )}
        </div>
        <div className="profilePosts">
          <h3>Publicaciones</h3>
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <div key={post.id} className="post">
                <div className="postHeader">
                  <h4>{post.title}</h4>
                  <p>{post.content}</p>
                  <small>
                    Publicado el {new Date(post.date).toLocaleString()}
                  </small>
                </div>
                <h5>Comentarios:</h5>
                {post.replies && post.replies.length > 0 ? (
                  post.replies
                    .slice()
                    .reverse()
                    .map((reply, index) => (
                      <div key={index} className="reply">
                        <p>{reply.text}</p>
                        <small>
                          Por {reply.name} -{" "}
                          {new Date(reply.date).toLocaleString()}
                        </small>
                      </div>
                    ))
                ) : (
                  <p>No hay comentarios</p>
                )}
              </div>
            ))
          ) : (
            <p>No hay publicaciones</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
