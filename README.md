# Netflix Clone - Project setup

- Setup Appwrite and store it's endpoint in `.env` (`APPWRITE_ENDPOINT`)
- Register user
- Create project and store it's ID in `.env` (`APPWRITE_PROJECT_ID`)
- Create API key and store it in `.env` (`APPWRITE_API_KEY`)
- Run migrations: `node migrations.js`
- Register at https://www.themoviedb.org/
- Create API key at https://www.themoviedb.org/settings/api
- Create API key for TMDB and store it in `.env`(`MDB_API_KEY`)
- Run seeds: `node seeds.js`

_Node version used: 16.x_
_Appwrite version: 0.12.x_

_Migrations is database structure (collections, attribudes, indexes)_
_Seeds is database content (documents, files)_
