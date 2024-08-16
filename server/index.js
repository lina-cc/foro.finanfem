const express = require("express");
const cors = require("cors");
const multer = require("multer"); // Importa multer
const path = require("path");
const connectDB = require("./database");
const app = express();
const PORT = 4000;

// Configuración para servir archivos estáticos desde la carpeta "uploads"
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Configuración de Multer para almacenar archivos en el servidor
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Renombrar archivo con timestamp
  },
});

const upload = multer({ storage });

// Genera un string aleatorio como ID
const generateID = () => Math.random().toString(36).substring(2, 10);

// Ruta de login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await connectDB();
  const usersCollection = db.collection("users");

  // Verifica si el usuario existe
  let result = await usersCollection.findOne({ email, password });
  if (!result) {
    return res.json({
      error_message: "Incorrect credentials",
    });
  }

  // Retorna el id, username y la URL de la imagen de perfil si se ha iniciado sesión con éxito
  res.json({
    message: "Login successfully",
    id: result.id,
    username: result.username,
    profilePicture: result.profilePicture || "/uploads/default-profile-pic.jpg", // Incluir la URL de la imagen de perfil, si no existe, usar una por defecto
  });
});

// Ruta de registro
app.post("/api/register", async (req, res) => {
  const { email, password, username } = req.body;
  const id = generateID();
  const db = await connectDB();
  const usersCollection = db.collection("users");

  // Verifica si ya existe un usuario con el mismo email
  const result = await usersCollection.findOne({ email });

  if (!result) {
    // Asigna una imagen de perfil por defecto
    const defaultProfilePicture = "/uploads/default-profile-pic.png"; // Asegúrate de tener esta imagen en tu carpeta de uploads

    const newUser = {
      id,
      email,
      password,
      username,
      profilePicture: defaultProfilePicture, // Agrega la imagen por defecto
    };

    // Añade el nuevo usuario a la base de datos
    await usersCollection.insertOne(newUser);

    return res.json({
      message: "Account created successfully!",
    });
  } else {
    // Si el usuario ya existe
    return res.json({
      error_message: "User already exists",
    });
  }
});

// Ruta para crear un hilo
app.post("/api/create/thread", async (req, res) => {
  const { thread, userId, description } = req.body;
  if (!thread || !userId) {
    return res.json({
      error_message: "Thread title and userId are required",
    });
  }
  const threadId = generateID();
  const db = await connectDB();
  const threadsCollection = db.collection("threads");
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.json({
      error_message: "User not found",
    });
  }

  // Agregar los detalles del post a la colección
  await threadsCollection.insertOne({
    id: threadId,
    title: thread,
    userId,
    userName: user.username,
    profilePicture: user.profilePicture || "", // Añadir la URL de la foto de perfil si existe
    description,
    replies: [],
    likes: [],
    date: new Date(),
  });

  // Retorna una respuesta que contiene los posts
  const threads = await threadsCollection.find().toArray();
  res.json({
    message: "Thread created successfully!",
    threads,
  });
});

// Ruta para obtener todos los hilos
app.get("/api/all/threads", async (req, res) => {
  const db = await connectDB();
  const threadsCollection = db.collection("threads");
  const threads = await threadsCollection.find().toArray();

  res.json({
    threads,
  });
});

// Ruta para dar like a un hilo
app.post("/api/thread/like", async (req, res) => {
  const { threadId, userId } = req.body;
  const db = await connectDB();
  const threadsCollection = db.collection("threads");

  const thread = await threadsCollection.findOne({ id: threadId });
  if (!thread.likes.includes(userId)) {
    thread.likes.push(userId);
    await threadsCollection.updateOne(
      { id: threadId },
      { $set: { likes: thread.likes } }
    );
    return res.json({
      message: "You've reacted to the post!",
    });
  }

  res.json({
    error_message: "You can only react once!",
  });
});

// Ruta para obtener las respuestas de un hilo
app.post("/api/thread/replies", async (req, res) => {
  const { id } = req.body;
  const db = await connectDB();
  const threadsCollection = db.collection("threads");

  const thread = await threadsCollection.findOne({ id });
  res.json({
    replies: thread.replies,
    title: thread.title,
  });
});

// Ruta para crear una respuesta en un hilo
app.post("/api/create/reply", async (req, res) => {
  const { threadId, userId, reply } = req.body;
  const db = await connectDB();
  const threadsCollection = db.collection("threads");
  const usersCollection = db.collection("users");

  const thread = await threadsCollection.findOne({ id: threadId });
  const user = await usersCollection.findOne({ id: userId });

  if (thread && user) {
    const newReply = {
      id: generateID(),
      userId: user.id,
      name: user.username,
      text: reply,
      date: new Date(),
    };

    thread.replies.unshift(newReply);

    await threadsCollection.updateOne(
      { id: threadId },
      { $set: { replies: thread.replies } }
    );
    return res.json({
      message: "Response added successfully!",
      newReply,
      threadId,
    });
  } else {
    return res.json({
      error_message: "Error adding response",
    });
  }
});

// Ruta para obtener los posts de un usuario
app.get("/api/user/:id/posts", async (req, res) => {
  const userId = req.params.id;
  const db = await connectDB();
  const threadsCollection = db.collection("threads");

  const userPosts = await threadsCollection.find({ userId }).toArray();
  res.json({
    posts: userPosts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.description,
      replies: post.replies,
    })),
  });
});

// Ruta para eliminar un hilo
app.delete("/api/delete/thread/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.body.userId;
  const db = await connectDB();
  const threadsCollection = db.collection("threads");

  const thread = await threadsCollection.findOne({ id });

  if (!thread) {
    return res.json({
      error_message: "Thread not found",
    });
  }

  if (thread.userId !== userId) {
    return res.json({
      error_message: "You do not have permission to delete this thread",
    });
  }

  const result = await threadsCollection.deleteOne({ id });

  if (result.deletedCount === 1) {
    const threads = await threadsCollection.find().toArray();
    return res.json({
      message: "Thread deleted successfully!",
      threads,
    });
  } else {
    return res.json({
      error_message: "Thread could not be deleted",
    });
  }
});

// Ruta para eliminar una respuesta de un hilo
app.delete("/api/thread/reply", async (req, res) => {
  const { threadId, replyId, userId } = req.body;
  const db = await connectDB();
  const threadsCollection = db.collection("threads");

  const thread = await threadsCollection.findOne({ id: threadId });

  if (thread) {
    const replyIndex = thread.replies.findIndex(
      (reply) => reply.id === replyId && reply.userId === userId
    );
    if (replyIndex !== -1) {
      thread.replies.splice(replyIndex, 1);
      await threadsCollection.updateOne(
        { id: threadId },
        { $set: { replies: thread.replies } }
      );
      return res.json({
        message: "Reply deleted successfully!",
        replies: thread.replies,
      });
    } else {
      return res.json({
        message:
          "Reply not found or you don't have permission to delete this reply",
      });
    }
  } else {
    return res.json({
      message: "Thread not found",
    });
  }
});

// Ruta para subir la imagen de perfil
app.post(
  "/api/user/:id/upload-picture",
  upload.single("profilePicture"),
  async (req, res) => {
    const userId = req.params.id;
    const db = await connectDB();
    const usersCollection = db.collection("users");

    if (!req.file) {
      return res
        .status(400)
        .json({ error_message: "No se ha subido ninguna imagen." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    await usersCollection.updateOne(
      { id: userId },
      { $set: { profilePicture: imageUrl } }
    );

    const updatedUser = await usersCollection.findOne({ id: userId });

    res.json({
      message: "Imagen de perfil actualizada con éxito",
      user: updatedUser,
    });
  }
);

// Ruta para actualizar la descripción del usuario
app.put("/api/user/:id", async (req, res) => {
  const userId = req.params.id;
  const { description } = req.body;
  const db = await connectDB();
  const usersCollection = db.collection("users");

  const result = await usersCollection.updateOne(
    { id: userId },
    { $set: { description } }
  );

  if (result.matchedCount === 1) {
    const user = await usersCollection.findOne({ id: userId });
    return res.json({
      message: "User description updated successfully!",
      user: {
        displayName: user.displayName || user.fullName,
        username: user.username,
        description: user.description,
        profilePicture: user.profilePicture,
      },
    });
  } else {
    return res.json({
      error_message: "User not found or could not be updated",
    });
  }
});

// Ruta para obtener los detalles del usuario
app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;
  const db = await connectDB();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ error_message: "User not found" });
  }

  res.json({
    user: {
      displayName: user.displayName || user.fullName,
      username: user.username,
      description: user.description || "Agrega una descripción",
      profilePicture: user.profilePicture,
    },
  });
});

app.delete("/api/user/:id", async (req, res) => {
  const userId = req.params.id;
  const db = await connectDB();
  const usersCollection = db.collection("users");
  const threadsCollection = db.collection("threads");

  // Eliminar el usuario de la colección de usuarios
  const userResult = await usersCollection.deleteOne({ id: userId });
  if (userResult.deletedCount === 0) {
    return res.status(404).json({ error_message: "User not found" });
  }

  // Eliminar todas las publicaciones del usuario
  const threadsResult = await threadsCollection.deleteMany({ userId: userId });

  // Eliminar los comentarios del usuario en otras publicaciones
  await threadsCollection.updateMany(
    { "replies.userId": userId }, // Filtra los hilos que tienen respuestas del usuario
    { $pull: { replies: { userId: userId } } } // Elimina esas respuestas
  );

  // Devolver un mensaje de éxito
  res.json({
    message: `User, ${threadsResult.deletedCount} posts, and all associated comments deleted successfully`,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
