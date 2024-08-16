const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017"; // Asegúrate de que esta URI coincide con tu configuración de MongoDB
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db("mi_forum_db"); // Nombre de tu base de datos
    console.log("Conectado a MongoDB");
    return db;
  } catch (err) {
    console.error(err);
  }
}

module.exports = connectDB;
