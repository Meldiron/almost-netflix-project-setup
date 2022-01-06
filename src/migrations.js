// Load .env
require("dotenv").config();

// Load libraries
const sdk = require("node-appwrite");

(async () => {
 console.log("🤖 Migrations started");
 const startTime = Date.now();

 // Prepare attributes
 const name = ["name", 255, true, undefined, false];
 const thumbnailImageId = ["thumbnailImageId", 255, true, undefined, false];
 const releaseDate = [
  "releaseDate",
  false,
  undefined,
  undefined,
  undefined,
  false,
 ];
 const cast = ["cast", 1024, true, undefined, false];
 const tags = ["tags", 1024, true, undefined, false];
 const genres = ["genres", 1024, true, undefined, false];
 const durationMinutes = ["durationMinutes", true, 1, 1000, undefined, false];
 const isOriginal = ["isOriginal", false, false, false];
 const netflixReleaseDate = [
  "netflixReleaseDate",
  false,
  undefined,
  undefined,
  undefined,
  false,
 ];
 const trendingIndex = [
  "trendingIndex",
  true,
  undefined,
  undefined,
  undefined,
  false,
 ];
 const description = [
  "description",
  5000,
  false,
  "Just watch it, no time to explain!",
  false,
 ];
 const ageRestriction = [
  "ageRestriction",
  ["AR7", "AR13", "AR16", "AR18"],
  true,
  undefined,
  false,
 ];

 const userId = ["userId", 255, true, undefined, false];
 const movieId = ["movieId", 255, true, undefined, false];
 const createdAt = ["createdAt", false, undefined, undefined, undefined, false];

 // Prepare permissions
 const defaultPermission = ["collection", ["role:member"], []];
 const watchlistPermission = ["document", ["role:member"], []];

 // Prepare Appwrite connection
 const client = new sdk.Client();
 const db = new sdk.Database(client);
 const storage = new sdk.Storage(client);

 client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
  .setSelfSigned();

 console.log("💼 Wiping project ...");

 // Wipe storage
 let lastListSum = 1;
 while (lastListSum > 0) {
  const filesResponse = await storage.listFiles(undefined, 100, 0);
  lastListSum = filesResponse.sum;

  for (const file of filesResponse.files) {
   await storage.deleteFile(file.$id);
  }
 }

 const deleteCollection = async (name) => {
  try {
   return await db.deleteCollection(name);
  } catch (err) {
   // All good, doesnt have to exist
   return null;
  }
 };

 // Delete old collections
 await Promise.all([
  deleteCollection("movies"),
  deleteCollection("watchlists"),
 ]);

 // Wait 5 seconds
 // TODO: Wait for delete to finish
 await new Promise((pRes) => {
  setTimeout(() => {
   pRes(true);
  }, 5000);
 });

 console.log("💼 Setting up project ...");

 // Setup collections
 await Promise.all([
  db.createCollection("movies", "Movies", ...defaultPermission),
  db.createCollection("watchlists", "Watchlists", ...watchlistPermission),
 ]);

 // Setup attributes
 await Promise.all([
  // Movies
  db.createStringAttribute("movies", ...name),
  db.createStringAttribute("movies", ...description),
  db.createStringAttribute("movies", ...thumbnailImageId),
  db.createIntegerAttribute("movies", ...releaseDate),
  db.createIntegerAttribute("movies", ...durationMinutes),
  db.createEnumAttribute("movies", ...ageRestriction),
  db.createIntegerAttribute("movies", ...netflixReleaseDate),
  db.createFloatAttribute("movies", ...trendingIndex),
  db.createBooleanAttribute("movies", ...isOriginal),
  db.createStringAttribute("movies", ...cast),
  db.createStringAttribute("movies", ...tags),
  db.createStringAttribute("movies", ...genres),

  db.createStringAttribute("watchlists", ...userId),
  db.createStringAttribute("watchlists", ...movieId),
  db.createIntegerAttribute("watchlists", ...createdAt),
 ]);

 // Wait 5 seconds
 // TODO: Wait for attribute creation to finish
 await new Promise((pRes) => {
  setTimeout(() => {
   pRes(true);
  }, 5000);
 });

 await Promise.all([
  db.createIndex("movies", "releaseDateDESC", "key", ["releaseDate"], ["DESC"]),
  db.createIndex(
   "movies",
   "durationMinutesDESC",
   "key",
   ["durationMinutes"],
   ["DESC"]
  ),
  db.createIndex("movies", "isOriginalDESC", "key", ["isOriginal"], ["DESC"]),
  db.createIndex(
   "movies",
   "trendingIndexDESC",
   "key",
   ["trendingIndex"],
   ["DESC"]
  ),
  db.createIndex("movies", "nameFULLTEXT", "fulltext", ["name"], ["ASC"]),
  db.createIndex("movies", "genresFULLTEXT", "fulltext", ["genres"], ["ASC"]),
  db.createIndex("movies", "castFULLTEXT", "fulltext", ["cast"], ["ASC"]),
  db.createIndex("movies", "tagsFULLTEXT", "fulltext", ["tags"], ["ASC"]),

  db.createIndex("watchlists", "createdAtDESC", "key", ["createdAt"], ["DESC"]),
  db.createIndex(
   "watchlists",
   "userIdASCmovieIdASC",
   "key",
   ["userId", "movieId"],
   ["ASC", "ASC"]
  ),
 ]);

 console.log(
  "❇️ Migraions finished in",
  Math.floor((Date.now() - startTime) / 1000),
  "s"
 );
})().catch((err) => {
 // Error handler
 console.log("🚨 Could not finish migration:");
 console.error(err);
 if (err.toJSON) {
  console.log(err.toJSON());
 }
});
