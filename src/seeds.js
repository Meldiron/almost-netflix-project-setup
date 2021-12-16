// Load .env
require("dotenv").config();

// Load libraries
const sdk = require("aw-node-db-alpha");
const { Readable } = require("stream");
const axios = require("axios").default;

(async () => {
 console.log("🤖 Seeds started");
 const startTime = Date.now();

 // Prepare Appwrite connection
 const client = new sdk.Client();
 const storage = new sdk.Storage(client);
 const db = new sdk.Database(client);

 client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

 // Get movies
 const downloadMovies = async (page = 1) => {
  const moviesResponse = await axios.get(
   `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.MDB_API_KEY}&page=${page}`
  );

  for (const movie of moviesResponse.data.results) {
   const imageUrl = movie.backdrop_path;

   if (!imageUrl) {
    console.log("🚧 Skipping ", movie.title);
    continue;
   }

   const movieResponse = await axios.get(
    `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.MDB_API_KEY}`
   );

   const movieKeywordsResponse = await axios.get(
    `https://api.themoviedb.org/3/movie/${movie.id}/keywords?api_key=${process.env.MDB_API_KEY}`
   );

   const movieCastResponse = await axios.get(
    `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${process.env.MDB_API_KEY}`
   );

   const image = await axios.get(
    `https://image.tmdb.org/t/p/w500/${imageUrl}`,
    { responseType: "stream" }
   );

   const file = await storage.createFile(
    "unique()",
    image.data,
    ["role:all"],
    []
   );

   const dbObject = {
    name: movie.title,
    description: movie.overview,
    thumbnailImageId: file.$id,
    cast: movieCastResponse.data.cast.map((c) => c.name),
    tags: movieKeywordsResponse.data.keywords.map((k) => k.name),
    genres: movieResponse.data.genres.map((g) => g.name),
    releaseYear: movieResponse.data.release_date
     ? +movieResponse.data.release_date.split("-")[0]
     : undefined,
    durationMinutes: Math.max(+movieResponse.data.runtime, 1),
    ageRestriction: movieResponse.data.adult ? "AR18" : "AR13",
   };

   await db.createDocument("movies", "unique()", dbObject);
  }
 };

 // Get TV shows
 const downloadShows = async (page = 1) => {
  const tvsResponse = await axios.get(
   `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.MDB_API_KEY}&page=${page}`
  );

  // title > name

  for (const tv of tvsResponse.data.results) {
   const imageUrl = tv.backdrop_path;

   if (!imageUrl) {
    console.log("🚧 Skipping ", tv.name);
    continue;
   }

   const tvResponse = await axios.get(
    `https://api.themoviedb.org/3/tv/${tv.id}?api_key=${process.env.MDB_API_KEY}`
   );

   const tvKeywordsResponse = await axios.get(
    `https://api.themoviedb.org/3/tv/${tv.id}/keywords?api_key=${process.env.MDB_API_KEY}`
   );

   const tvCastResponse = await axios.get(
    `https://api.themoviedb.org/3/tv/${tv.id}/credits?api_key=${process.env.MDB_API_KEY}`
   );

   const image = await axios.get(
    `https://image.tmdb.org/t/p/w500/${imageUrl}`,
    { responseType: "stream" }
   );

   const file = await storage.createFile(
    "unique()",
    image.data,
    ["role:all"],
    []
   );

   const dbObject = {
    name: tv.name,
    description: tv.overview,
    thumbnailImageId: file.$id,
    cast: tvCastResponse.data.cast.map((c) => c.name),
    tags: tvKeywordsResponse.data.results.map((k) => k.name),
    genres: tvResponse.data.genres.map((g) => g.name),
    releaseYear: tvResponse.data.first_air_date
     ? +tvResponse.data.first_air_date.split("-")[0]
     : undefined,
    ageRestriction: "AR18", // TODO: We dont have?
   };

   const { $id: showId } = await db.createDocument(
    "shows",
    "unique()",
    dbObject
   );

   let seasonSortIndex = 0;
   for (const season of tvResponse.data.seasons) {
    const dbSeasonObject = {
     showId,
     sortIndex: seasonSortIndex,
     name: season.name,
     description: season.overview,
     releaseYear: season.air_date ? season.air_date.split("-")[0] : undefined,
    };

    const dbSeasonResponse = await db.createDocument(
     "showSeasons",
     "unique()",
     dbSeasonObject
    );
    const seasonId = dbSeasonResponse.$id;
    seasonSortIndex++;

    const tvSeasonDetail = await axios.get(
     `https://api.themoviedb.org/3/tv/${tv.id}/season/${season.season_number}?api_key=${process.env.MDB_API_KEY}`
    );

    let episodeSortIndex = 0;
    for (const episode of tvSeasonDetail.data.episodes) {
     const dbEpisodeObject = {
      showSeasonId: seasonId,
      sortIndex: episodeSortIndex,
      name: episode.name,
      description: episode.overview,
      releaseYear: episode.air_date
       ? episode.air_date.split("-")[0]
       : undefined,
      durationMinutes: 1, // TODO: We dont have?
     };

     await db.createDocument("showEpisodes", "unique()", dbEpisodeObject);

     episodeSortIndex++;
    }
   }
  }
 };

 const maxPage = 5;

 console.log(`🤖 Will download ${maxPage * 20} TV shows`);
 for (let page = 1; page <= maxPage; page++) {
  console.log(`💼 [${page}/${maxPage}] Downloading +20 TV shows ...`);
  await downloadShows(page);
 }

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
});
