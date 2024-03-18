const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 4350;

// Api urls
const ProxyApi = "https://proxy.techzbots1.workers.dev/?u=";
const animeapi = "/anime/";
const episodeapi = "/episode/";
const dlapi = "/download/";
const searchapi = "/search/";
const popularapi = "https://api.anime-dex.workers.dev/gogoPopular/";

// Api Server Manager
const AvailableServers = [
    "https://api1.anime-dex.workers.dev",
    "https://api2.anime-dex.workers.dev",
    "https://api3.anime-dex.workers.dev",
];

function getApiServer() {
    return AvailableServers[Math.floor(Math.random() * AvailableServers.length)];
}

// Usefull functions


async function getJson(path, errCount = 0) {
    const ApiServer = getApiServer();

    if (errCount > 2) {
        throw `Too many errors while fetching ${ApiServer}${path}`;
    }

    let url = `${ApiServer}/${path}`;

    if (errCount > 0) {
        // Retry fetch using proxy
        console.log("Retrying fetch using proxy");
        url = ProxyApi + encodeURIComponent(url); // Encode the entire URL before passing to the proxy
    }

    try {
        const response = await fetch(url);
        return await response.json();
    } catch (errors) {
        console.error(errors);
        return getJson(path, errCount + 1);
    }
}

// Function to get download links for ad free servers
async function getAdFreeDownloadLinks(anime, episode) {
    const data = (await getJson(dlapi + anime + "-episode-" + episode))["results"];
    const adFreeLinks = {
        "AD Free 1": data["adfree1"],
        "AD Free 2": data["adfree2"]
    };
    return adFreeLinks;
}


app.get('/', (req, res) => {
  res.send('Api Fetch success<br><br>Routes:<br>api/search?query={Query}<br>api/anime/{AnimeName}<br>api/episode/{EpisodeTitle}/{EpNumber}<br>api/popular/{Number}<br>api/upcoming/{number}<br>api/recent/{number}');
});


// Define API routes

// Route to get anime data
app.get('/api/anime/:animeName', async (req, res) => {
    const animeName = req.params.animeName;

    try {
        // Assuming there's an endpoint to fetch anime data based on name
        const animeData = await getJson(animeapi + animeName);
        res.json(animeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/episode/:episodeTitle', async (req, res) => {
    const episodeTitle = req.params.episodeTitle;
    try {
        const episodeData = await getJson(episodeapi + episodeTitle);
        res.json(episodeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Route to get ad-free download links
app.get('/api/adfreedownload', async (req, res) => {
    const anime = req.query.anime;
    const episode = req.query.episode;

    try {
        const downloadLinks = await getAdFreeDownloadLinks(anime, episode);
        res.json(downloadLinks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to search for anime
app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "query" is required' });
    }

    try {
        const data = await getJson(searchapi + query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get popular anime data
app.get('/api/popular/:pageNumber', async (req, res) => {
    const pageNumber = req.params.pageNumber;

    try {
        const popularData = await getJson(`${popularapi}${pageNumber}`);
        res.json(popularData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get recent anime data
app.get('/api/recent/:pageNumber', async (req, res) => {
    const pageNumber = req.params.pageNumber;

    try {
        const recentData = await getJson(`https://api.anime-dex.workers.dev/recent/${pageNumber}`);
        res.json(recentData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get upcoming anime data
app.get('/api/upcoming/:pageNumber', async (req, res) => {
    const pageNumber = req.params.pageNumber;

    try {
        const upcomingData = await getJson(`https://api.anime-dex.workers.dev/upcoming/${pageNumber}`);
        res.json(upcomingData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});