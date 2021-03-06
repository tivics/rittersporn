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
    <img src="images/jaskier.png" alt="Logo" width="219" height="138">
  </a>

<h3 align="center">Rittersporn</h3>

  <p align="center">
    Discord Bot and friend of Geralt of Rivia 
    <br />
    <a href="https://github.com/tivics/rittersporn"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/tivics/rittersporn/issues">Report Bug</a>
    ·
    <a href="https://github.com/tivics/rittersporn/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://github.com/tivics/rittersporn/)

Rittersporn is social media Discord Bot that currently offers the following features:
* play music from a Youtube video/ audio source
* post a RSS feed from a selected source
* post tweets from a selected user

<p align="right">(<a href="#top">back to top</a>)</p>



### Built With

* [Node.js](https://nodejs.org)
* [Discord.js](https://discord.js.org/#/)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

First install latest version of NPM
* npm
  ```sh
  npm install npm@latest -g
  ```
 
### Installation

1. Register on [Discord Developer Portal](https://discord.com/developers/applications) and create a free Discord Application 
2. Create a new Bot and provide Admin rights
3. Create a token and save it e.g. in notepad++
4. Register on [Twitter Developer Portal](https://developer.twitter.com/en/portal/) and create a new application
5. Create a bearer token and save it e.g. in notepad++
6. Clone the repo
   ```sh
   git clone git@github.com:tivics/rittersporn.git
   ```
7. Create a `.env` file in the project folder and enter
   ```sh 
   npm install dotenv --save-dev
   ```
8. Install NPM packages
   ```sh
   npm install discord.js
   npm i @discordjs/voice
   npm i nodemon -g
   npm install ytdl-core@latest
   npm i ffmpeg
   npm i opusscript 
   npm i libsodium-wrappers
   npm i libsodium
   npm install --save rss-parser
   npm i sqlite3
   npm i twitter-api-v2
   ```
9.  Download [SQLite Precompiled Binaries for Windows](https://www.sqlite.org/download.html) and unzip it to your chosen destination
10. Go to Control Panel > System > Advanced System Settings > Environment Variables · Double click the "Path" item from User variables and add the path to SQLite e.g. C:\Program Files\SQLite
11. SQLite Database Setup
Open Windows command line and navigate to your project path

Create Database:
```sh
sqlite3 yourdatabasename.db
```
Create RSS Table:
```sh
    CREATE TABLE NEWS(
      ID INT PRIMARY  KEY NOT NULL,
      PUB_DATE  TEXT  NOT NULL,
      TITLE TEXT  NOT NULL,
      PROVIDER  TEXT  NOT NULL
    );
```
Create Twitter Table:
```sh
    CREATE TABLE TWEETS(
      ID INT PRIMARY  KEY NOT NULL,
      TWEET_ID  TEXT  NOT NULL,
      USER_ID TEXT  NOT NULL
    );
```
12. `.env` Setup:
   ```js
   "DISCORD_BOT_TOKEN=YOUR TOKEN THAT YOU CREATED IN STEP 3"
   "TWITTER_BEARER_TOKEN=YOUR TOKEN THAT YOU CREATED IN STEP 5"
   "RSS_FEED=URL OF RSS FEED YOU WANT TO FOLLOW"
   "CHANNEL_RSS=CHANNEL IN WHICH RSS NEWS SHOULD BE POSTED"
   "PROVIDER_RSS=YOUR RSS PROVIDER E.G. GAMESTAR, REQUIRED FOR DB"
   "TWITTER_USER=TWITTER USER YOU WANT TO FOLLOW"
   "CHANNEL_TWITTER=CHANNEL IN WHICH TWEETS SHOULD BE POSTED"
   "DATABASE_PATH=SQLITE DB PATH"
   ```
<p align="right">(<a href="#top">back to top</a>)</p>



<!-- Usage -->
## Usage

Tell Rittersporn what to do by typing commands into a text channel of your choice.

* join a voice channel and type in ``` !play YOUTUBE_URL``` to start playing music in the voice channel you are currently in
* type in ``` !stop ``` to stop the playback

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ 2022 ] Spotify integration

See the [open issues](https://github.com/tivics/rittersporn/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License
<!-- Distributed under the MIT License. See `LICENSE.txt` for more information. -->

TBD

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

<a href="mailto:christian.schaefer.07@gmail.com">Christian Schäfer</a> - [@tivics7](https://twitter.com/tivics7)

Project Link: [rittersporn](https://github.com/tivics/rittersporn)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* []()
* []()
* []()

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
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