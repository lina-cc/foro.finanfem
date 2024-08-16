import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import "./Home.css";
import Likes from "../utils/Likes";
import CommentsIcon from "../utils/Comments";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [threadList, setThreadList] = useState([]);
  const [reply, setReply] = useState("");
  const [showReplyBox, setShowReplyBox] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      if (!localStorage.getItem("_id")) {
        navigate("/");
      } else {
        fetch("http://localhost:4000/api/all/threads")
          .then((res) => res.json())
          .then((data) => {
            setThreadList(data.threads || []);
          })
          .catch((err) => console.error(err));
      }
    };
    checkUser();
  }, [navigate]);

  const createThread = () => {
    const userId = localStorage.getItem("_id");
    fetch("http://localhost:4000/api/create/thread", {
      method: "POST",
      body: JSON.stringify({
        thread: title,
        description,
        userId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setThreadList(data.threads || []);
        setTitle("");
        setDescription("");
      })
      .catch((err) => console.error(err));
  };

  const addReply = (threadId) => {
    fetch("http://localhost:4000/api/create/reply", {
      method: "POST",
      body: JSON.stringify({
        threadId,
        userId: localStorage.getItem("_id"),
        reply,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setThreadList((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? { ...thread, replies: [data.newReply, ...thread.replies] }
              : thread
          )
        );
        setReply(""); // Limpia el campo de comentarios después de enviar
      })
      .catch((err) => console.error(err));
  };

  const deleteThread = (threadId) => {
    const userId = localStorage.getItem("_id");
    fetch(`http://localhost:4000/api/delete/thread/${threadId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }), // Enviar el userId en el cuerpo de la solicitud
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setThreadList(data.threads || []);
      })
      .catch((err) => console.error(err));
  };

  const handleSubmitReply = (e, threadId) => {
    e.preventDefault();
    addReply(threadId);
  };

  const toggleReplyBox = (threadId) => {
    setShowReplyBox((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
  };

  return (
    <>
      <Nav />
      <main className="home">
        <div className="homeformcontainer">
          <h2 className="homeTitle">Crea una publicación</h2>
          <form className="homeForm" onSubmit={createThread}>
            <div className="home__container">
              <label htmlFor="title">Título</label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="home__container">
              <label htmlFor="description">Descripción</label>
              <textarea
                name="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button className="homeBtn">Publicar</button>
          </form>
        </div>
        <div className="thread__container">
          {threadList.length > 0 ? (
            threadList.map((thread) => (
              <div className="thread__item" key={thread.id}>
                <div className="thread__header">
                  <div className="thread__author">
                    <img
                      src={`http://localhost:4000${thread.profilePicture}`}
                      alt={thread.userName}
                      className="profile-picture"
                    />
                    <div>
                      <h4>{thread.userName}</h4>
                      <p>{new Date(thread.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <h4>{thread.title}</h4>
                  <p>{thread.description}</p>
                </div>
                <div className="react__container">
                  <div className="left">
                    <Likes
                      numberOfLikes={thread.likes.length}
                      threadId={thread.id}
                    />
                  </div>
                  <div className="center">
                    <CommentsIcon
                      numberOfComments={thread.replies.length}
                      onClick={() => toggleReplyBox(thread.id)}
                    />
                  </div>
                  <div className="right">
                    {thread.userId === localStorage.getItem("_id") && (
                      <button
                        onClick={() => deleteThread(thread.id)}
                        className="deleteBtn"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 6h12m-6 0V4m2 16V10M8 20V10m8 10h-8m10-14h-12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {thread.replies && thread.replies.length > 0 && (
                  <div className="repliesSection">
                    {thread.replies
                      .slice()
                      .reverse()
                      .map((reply, index) => (
                        <div key={index} className="replyItem">
                          <p>{reply.text}</p>
                          <small>
                            Por {reply.name} -{" "}
                            {new Date(reply.date).toLocaleString()}
                          </small>
                        </div>
                      ))}
                  </div>
                )}
                {showReplyBox[thread.id] && ( // Mueve la caja de comentarios aquí
                  <form
                    className="replyForm"
                    onSubmit={(e) => handleSubmitReply(e, thread.id)}
                  >
                    <textarea
                      rows={2}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Añadir un comentario..."
                    />
                    <button type="submit" className="replyBtn">
                      Comentar
                    </button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <p>No hay publicaciones disponibles</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
