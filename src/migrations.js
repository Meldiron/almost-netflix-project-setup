// Load .env
require("dotenv").config();

// Load libraries
const sdk = require("aw-node-db-alpha");

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
 const showId = ["showId", 255, true, undefined, false];
 const showSeasonId = ["showSeasonId", 255, true, undefined, false];
 const sortIndex = ["sortIndex", true, 0, 1000, undefined, false];

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

 // Prepare permissions
 const defaultPermission = ["collection", ["role:all"], []];

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
  deleteCollection("movieMeta"),
  deleteCollection("shows"),
  deleteCollection("showSeasons"),
  deleteCollection("showEpisodes"),
 ]);

 // Wait 5 seconds
 // TODO: Wait for delete to finish
 await new Promise((pRes) => {
  setTimeout(() => {
   pRes(true);
  }, 5000);
 });

 console.log("💼 Setting up project ...");

 // TODO: Prepare indexes

 // Setup collections
 await Promise.all([
  db.createCollection("movies", "Movies", ...defaultPermission),
  //   db.createCollection("movieMeta", "Movies - Metadata", ...defaultPermission),

  db.createCollection("shows", "Shows", ...defaultPermission),
  db.createCollection("showSeasons", "Shows - Seasons", ...defaultPermission),
  db.createCollection("showEpisodes", "Shows - Episodes", ...defaultPermission),
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

  // Shows
  db.createStringAttribute("shows", ...name),
  db.createStringAttribute("shows", ...description),
  db.createEnumAttribute("shows", ...ageRestriction),
  db.createStringAttribute("shows", ...thumbnailImageId),
  db.createStringAttribute("shows", ...cast),
  db.createStringAttribute("shows", ...tags),
  db.createStringAttribute("shows", ...genres),
  db.createIntegerAttribute("shows", ...releaseDate),

  // Shows - Seasons
  db.createStringAttribute("showSeasons", ...showId),
  db.createIntegerAttribute("showSeasons", ...sortIndex),
  db.createStringAttribute("showSeasons", ...name),
  db.createStringAttribute("showSeasons", ...description),
  db.createIntegerAttribute("showSeasons", ...releaseDate),

  // Shows - Episodes
  db.createStringAttribute("showEpisodes", ...showSeasonId),
  db.createIntegerAttribute("showEpisodes", ...sortIndex),
  db.createStringAttribute("showEpisodes", ...name),
  db.createStringAttribute("showEpisodes", ...description),
  db.createIntegerAttribute("showEpisodes", ...releaseDate),
  db.createIntegerAttribute("showEpisodes", ...durationMinutes),
 ]);

 // TODO: Setup indexes

 // Wait 5 seconds
 // TODO: Wait for attribute creation to finish
 await new Promise((pRes) => {
  setTimeout(() => {
   pRes(true);
  }, 5000);
 });

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
