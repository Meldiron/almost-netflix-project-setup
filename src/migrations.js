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



    // Prepare Appwrite connection
    const client = new sdk.Client();
    const db = new sdk.Databases(client);
    const storage = new sdk.Storage(client);

    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY)
        .setSelfSigned();

    console.log("💼 Wiping project ...");

    const bucketList = await storage.listBuckets();

    for (const bucket of bucketList.buckets) {
        // Wipe storage
        let lastListSum = 1;
        while (lastListSum > 0) {
            const filesResponse = await storage.listFiles(bucket.$id);
            lastListSum = filesResponse.sum;

            for (const file of filesResponse.files) {
                await storage.deleteFile(file.$id);
            }
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

    const deleteDatabase = async (name) => {
        try {
            return await db.delete(name)
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

    deleteDatabase("almost-netflix-project-db")

    // Wait 5 seconds
    // TODO: Wait for delete to finish
    await new Promise((pRes) => {
        setTimeout(() => {
            pRes(true);
        }, 5000);
    });

    console.log("💼 Setting up project ...");

    await db.create("almost-netflix-project-db", "Almost Netflix Project")

    // Prepare permissions
    const defaultPermission = ["collection", ["users"], []];
    const watchlistPermission = ["document", ["users"], []];

    // Setup collections
    await Promise.all([
        db.createCollection("almost-netflix-project-db", "movies", "Movies", [
            sdk.Permission.read(sdk.Role.users()),
            sdk.Permission.write(sdk.Role.users()),
            sdk.Permission.update(sdk.Role.users()),
            sdk.Permission.delete(sdk.Role.users())
        ]),
        db.createCollection("almost-netflix-project-db", "watchlists", "Watchlists",
            [
                sdk.Permission.read(sdk.Role.users()),
            ], true)
    ]);

    // Setup attributes
    await Promise.all([
        // Movies
        db.createStringAttribute("almost-netflix-project-db", "movies", ...name),
        db.createStringAttribute("almost-netflix-project-db", "movies", ...description),
        db.createStringAttribute("almost-netflix-project-db", "movies", ...thumbnailImageId),
        db.createIntegerAttribute("almost-netflix-project-db", "movies", ...releaseDate),
        db.createIntegerAttribute("almost-netflix-project-db", "movies", ...durationMinutes),
        db.createEnumAttribute("almost-netflix-project-db", "movies", ...ageRestriction),
        db.createIntegerAttribute("almost-netflix-project-db", "movies", ...netflixReleaseDate),
        db.createFloatAttribute("almost-netflix-project-db", "movies", ...trendingIndex),
        db.createBooleanAttribute("almost-netflix-project-db", "movies", ...isOriginal),
        db.createStringAttribute("almost-netflix-project-db", "movies", ...cast),
        db.createStringAttribute("almost-netflix-project-db", "movies", ...tags),
        db.createStringAttribute("almost-netflix-project-db", "movies", ...genres),

        db.createStringAttribute("almost-netflix-project-db", "watchlists", ...userId),
        db.createStringAttribute("almost-netflix-project-db", "watchlists", ...movieId),
        db.createIntegerAttribute("almost-netflix-project-db", "watchlists", ...createdAt),
    ]);

    // Wait 5 seconds
    // TODO: Wait for attribute creation to finish
    await new Promise((pRes) => {
        setTimeout(() => {
            pRes(true);
        }, 5000);
    });

    await Promise.all([
        db.createIndex("almost-netflix-project-db","movies", "releaseDateDESC", "key", ["releaseDate"], ["DESC"]),
        db.createIndex(
            "almost-netflix-project-db",
            "movies",
            "durationMinutesDESC",
            "key",
            ["durationMinutes"],
            ["DESC"]
        ),
        db.createIndex("almost-netflix-project-db","movies", "isOriginalDESC", "key", ["isOriginal"], ["DESC"]),
        db.createIndex(
            "almost-netflix-project-db",
            "movies",
            "trendingIndexDESC",
            "key",
            ["trendingIndex"],
            ["DESC"]
        ),
        db.createIndex("almost-netflix-project-db","movies", "nameFULLTEXT", "fulltext", ["name"], ["ASC"]),
        db.createIndex("almost-netflix-project-db","movies", "genresFULLTEXT", "fulltext", ["genres"], ["ASC"]),
        db.createIndex("almost-netflix-project-db","movies", "castFULLTEXT", "fulltext", ["cast"], ["ASC"]),
        db.createIndex("almost-netflix-project-db","movies", "tagsFULLTEXT", "fulltext", ["tags"], ["ASC"]),

        db.createIndex("almost-netflix-project-db","watchlists", "createdAtDESC", "key", ["createdAt"], ["DESC"]),
        db.createIndex(
            "almost-netflix-project-db",
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
