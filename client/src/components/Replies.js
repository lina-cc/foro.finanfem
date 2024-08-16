import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const Replies = () => {
  const [replyList, setReplyList] = useState([]);
  const [reply, setReply] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { id } = useParams();

  const fetchReplies = useCallback(() => {
    fetch("http://localhost:4000/api/thread/replies", {
      method: "POST",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.replies) {
          setReplyList(data.replies);
        } else {
          setReplyList([]);
        }
        setTitle(data.title || ""); // Asegura que title no sea undefined
        setDescription(data.description || ""); // Asegura que description no sea undefined
      })
      .catch((err) => console.error(err));
  }, [id]);

  const addReply = () => {
    fetch("http://localhost:4000/api/create/reply", {
      method: "POST",
      body: JSON.stringify({
        id,
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
        if (data.message === "Response added successfully!") {
          fetchReplies(); // Actualiza la lista de respuestas después de añadir una nueva
          setReply("");
        }
      })
      .catch((err) => console.error(err));
  };

  const deleteReply = (replyId) => {
    fetch("http://localhost:4000/api/thread/reply", {
      method: "DELETE",
      body: JSON.stringify({
        threadId: id,
        replyId,
        userId: localStorage.getItem("_id"),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        if (data.message === "Reply deleted successfully!") {
          setReplyList(data.replies);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleSubmitReply = (e) => {
    e.preventDefault();
    addReply();
  };

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  return (
    <main className="replies">
      <h1 className="repliesTitle">{title}</h1>
      <p>{description}</p> {/* Mostrar la descripción */}
      <form className="modal__content" onSubmit={handleSubmitReply}>
        <label htmlFor="reply">Reply to the thread</label>
        <textarea
          rows={5}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          type="text"
          name="reply"
          className="modalInput"
        />

        <button className="modalBtn">SEND</button>
      </form>
      <div className="thread__container">
        {replyList && replyList.length > 0 ? (
          replyList.map((reply, index) => (
            <div className="thread__item" key={index}>
              <p>{reply.text}</p>
              <div className="react__container">
                <p style={{ opacity: "0.5" }}>by {reply.name}</p>
                {reply.userId === localStorage.getItem("_id") && (
                  <button onClick={() => deleteReply(reply.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No hay respuestas disponibles</p>
        )}
      </div>
    </main>
  );
};

export default Replies;
