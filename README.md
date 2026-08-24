<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/tivics/rittersporn">
    <img src="images/jaskier.png" alt="Rittersporn logo" width="219" height="138">
  </a>

  <h3 align="center">Rittersporn</h3>

  <p align="center">
    A Discord bot for music playback, community updates, and server-side helpers.
    <br />
    <a href="https://github.com/tivics/rittersporn"><strong>Explore the project »</strong></a>
    <br />
    <br />
    <a href="https://github.com/tivics/rittersporn/issues">Report a bug</a>
    ·
    <a href="https://github.com/tivics/rittersporn/issues">Request a feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

Rittersporn is a Discord bot that combines social updates with voice-control features. The current implementation supports YouTube music playback, RSS/Twitter posting, and a lightweight REST API for controlling playback from other tools.

## Features

- Music playback in a Discord voice channel via yt-dlp
  - Supports direct URLs and search queries
  - Commands: !join, !play, !stop
- RSS feed posting to a configured Discord channel
- Twitter/X post forwarding to a configured Discord channel
- REST endpoints for playback control:
  - GET /play
  - GET /search
  - GET /channel

### Built With

- [Node.js](https://nodejs.org)
- [Discord.js](https://discord.js.org/#/)
- [@discordjs/voice](https://discordjs.guide/voice/)
- [Express](https://expressjs.com/)
- [sqlite3](https://www.sqlite.org/)
- [rss-parser](https://github.com/rb2k/rss-parser)
- [twitter-api-v2](https://github.com/plhery/node-twitter-api-v2)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) via the local binary

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Discord bot token
- A Twitter/X bearer token (if you want tweet forwarding)
- SQLite installed locally
- yt-dlp available in your PATH or configured via YTDLP_PATH

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/tivics/rittersporn.git
   cd rittersporn
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Create a `.env` file in the project root with the following values:
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   RSS_FEED=https://example.com/feed.xml
   CHANNEL_RSS=your_rss_channel_id
   PROVIDER_RSS=GAMESTAR
   TWITTER_USER=your_twitter_username
   CHANNEL_TWITTER=your_twitter_channel_id
   DATABASE_PATH=./data/rittersporn.db
   FAVORITES_PATH=./data/favorites.db
   YTDLP_PATH=yt-dlp
   ```
4. Create the SQLite database and tables
   ```sh
   sqlite3 ./data/rittersporn.db
   ```

   ```sql
   CREATE TABLE IF NOT EXISTS NEWS (
     ID INTEGER PRIMARY KEY NOT NULL,
     PUB_DATE TEXT NOT NULL,
     TITLE TEXT NOT NULL,
     PROVIDER TEXT NOT NULL
   );

   CREATE TABLE IF NOT EXISTS TWEETS (
     ID INTEGER PRIMARY KEY NOT NULL,
     TWEET_ID TEXT NOT NULL,
     USER_ID TEXT NOT NULL
   );
   ```

   If you want to use the favorites store as well, create:

   ```sql
   CREATE TABLE IF NOT EXISTS FAVORITES (
     ID INTEGER PRIMARY KEY NOT NULL,
     NAME TEXT NOT NULL,
     URL TEXT NOT NULL,
     COUNT INTEGER NOT NULL
   );
   ```
5. Start the bot
   ```sh
   npm start
   ```

## Usage

Use the bot in a Discord text channel by sending commands such as:

- `!join` - join the current voice channel
- `!play <url-or-search-term>` - start playback from a URL or a search query
- `!stop` - stop the current track
- `!delete` - remove recent messages from the channel

The bot also exposes a small REST API for external integrations:

- `GET /play?guildID=...&channelID=...&url=...`
- `GET /search?guildID=...&channelID=...&searchTerm=...`
- `GET /channel`

## Roadmap

- Add support for adding songs to a playlist or queue so that multiple tracks can be played one after another
- Allow a new play request while a track is already playing to queue the song instead of replacing the current playback

See the [open issues](https://github.com/tivics/rittersporn/issues) for the latest ideas and known issues.

## License

TBD

## Contact

<a href="mailto:christian.schaefer.07@gmail.com">Christian Schäfer</a> - [@tivics7](https://twitter.com/tivics7)

Project link: [rittersporn](https://github.com/tivics/rittersporn)

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/tivics/rittersporn.svg?style=for-the-badge
[contributors-url]: https://github.com/tivics/rittersporn/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/tivics/rittersporn.svg?style=for-the-badge
[forks-url]: https://github.com/tivics/rittersporn/network/members
[stars-shield]: https://img.shields.io/github/stars/tivics/rittersporn.svg?style=for-the-badge
[stars-url]: https://github.com/tivics/rittersporn/stargazers
[issues-shield]: https://img.shields.io/github/issues/tivics/rittersporn.svg?style=for-the-badge
[issues-url]: https://github.com/tivics/rittersporn/issues
[license-shield]: https://img.shields.io/github/license/tivics/rittersporn.svg?style=for-the-badge
[license-url]: https://github.com/tivics/rittersporn/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/christian-schäfer-a9818012a/
[product-screenshot]: images/product.png