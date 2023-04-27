# Netflix Clone - Project setup

## Requirements

* [Node.js](https://nodejs.org/en/) - 16.x
* [Appwrite](https://appwrite.io/) - 1.3.x
* [Appwrite CLI](https://appwrite.io/docs/command-line)
* API Key from [TMDB](https://www.themoviedb.org/documentation/api)

## Getting Started

1. Create a Project in Appwrite with the ID `almost-netflix`
2. Deploy the Collections using the using the [Appwrite CLI](https://appwrite.io/docs/command-line) and provided `appwrite.json`

   ```bash
   appwrite deploy collection --all --yes
   ```

3. Deploy the bucket for the posters

   ```bash
   appwrite deploy bucket
   ```

4. Create an API Key for the seed script and take note of the `secret` value
   
   ```bash
   appwrite projects createKey --projectId 'almost-netflix' --name "Seed Script" --scopes documents.write files.write
   ```

5. Create a `.env` file from `.env.example` and fill in:
   * `APPWRITE_ENDPOINT` - The endpoint of your Appwrite instance
   * `APPWRITE_SELF_SIGNED` - Set to `true` to allow self-signed certificates
   * `APPWRITE_API_KEY` - The API Key secret from the previous step
   * `TMDB_API_KEY` - The API Key from TMDB
6. Install dependencies: `npm i`
7. Run the seed script: `npm run seeds`
