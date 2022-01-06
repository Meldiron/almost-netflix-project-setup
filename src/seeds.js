// Load .env
require("dotenv").config();

// Load libraries
const sdk = require("node-appwrite");
const axios = require("axios").default;

// Prepare Appwrite connection
const client = new sdk.Client();
const storage = new sdk.Storage(client);
const db = new sdk.Database(client);

client
 .setEndpoint(process.env.APPWRITE_ENDPOINT)
 .setProject(process.env.APPWRITE_PROJECT_ID)
 .setKey(process.env.APPWRITE_API_KEY)
 .setSelfSigned();

const intiniteRequest = async function (self, func, argsArr, attempt = 1) {
 try {
  const res = await func.bind(self)(...argsArr);

  if (attempt > 1) {
   console.log("Successfully pushed in attempt:" + attempt);
  }
  return res;
 } catch (err) {
  console.log(err);
  console.log("Will retry! Current attempt: " + attempt);

  await new Promise((pRes) => {
   setTimeout(() => {
    pRes(true);
   }, 1000);
  });

  return await intiniteRequest(self, func, argsArr, attempt + 1);
 }
};

(async () => {
 console.log("🤖 Seeds started");
 const startTime = Date.now();

 // Get movies
 const downloadMovies = async (page = 1) => {
  const moviesResponse = await axios.get(
   `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.MDB_API_KEY}&page=${page}`
  );

  for (const movie of moviesResponse.data.results) {
   const imageUrl = movie.poster_path;

   if (!imageUrl) {
    console.log("🚧 Skipping ", movie.title);
    continue;
   }

   let imageAbsoluteUrl = `https://image.tmdb.org/t/p/original${
    imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl
   }`;

   const [movieResponse, movieKeywordsResponse, movieCastResponse, image] =
    await Promise.all([
     axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.MDB_API_KEY}`
     ),

     axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}/keywords?api_key=${process.env.MDB_API_KEY}`
     ),

     axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${process.env.MDB_API_KEY}`
     ),

     axios.get(imageAbsoluteUrl, {
      responseType: "stream",
     }),
    ]);

   const file = await intiniteRequest(storage, storage.createFile, [
    "unique()",
    image.data,
    ["role:all"],
    [],
   ]);

   const cast = movieCastResponse.data.cast
    .sort((a, b) => (a.popularity > b.popularity ? -1 : 1))
    .filter((c, cIndex) => cIndex < 5)
    .map((v) => v.name);
   const tags = movieKeywordsResponse.data.keywords.map((v) => v.name);
   const genres = movieResponse.data.genres.map((v) => v.name);

   let releaseDate = undefined;
   try {
    const [releaseYear, releaseMonth, releaseDay] =
     movieResponse.data.release_date.split("-");
    releaseDate = new Date(releaseYear, releaseMonth - 1, releaseDay);
   } catch (err) {
    // No date, its OK
   }

   const netflixDate = Date.now() - 86400000 * Math.round(Math.random() * 1000);

   const dbObject = {
    name: movie.title,
    description: movie.overview,
    thumbnailImageId: file.$id,
    releaseDate: releaseDate
     ? Math.floor(releaseDate.getTime() / 1000)
     : undefined,
    durationMinutes: Math.max(+movieResponse.data.runtime, 1),
    ageRestriction: movieResponse.data.adult ? "AR18" : "AR13",
    trendingIndex: movieResponse.data.popularity,
    isOriginal: Math.random() < 0.1,
    netflixReleaseDate: Math.floor(netflixDate / 1000),
    genres: genres.join(", "),
    tags: tags.join(", "),
    cast: cast.join(", "),
   };

   const dbDocument = await intiniteRequest(db, db.createDocument, [
    "movies",
    "unique()",
    dbObject,
   ]);
  }
 };

 const maxPage = 25;

 console.log(`🤖 Will download ${maxPage * 20} movies`);
 for (let page = 1; page <= maxPage; page++) {
  console.log(`💼 [${page}/${maxPage}] Downloading +20 movies ...`);
  await downloadMovies(page);
 }

 console.log(
  "❇️ Seeds finished in",
  Math.floor((Date.now() - startTime) / 1000),
  "s"
 );
})().catch((err) => {
 // Error handler
 console.log("🚨 Could not finish seeds:");
 console.error(err);
 if (err.toJSON) {
  console.log(err.toJSON());
 }
});
