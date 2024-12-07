import Mustache from "mustache";
import fs from "fs";
import fetch from 'node-fetch';
const MUSTACHE_MAIN_DIR = './template.mustache';

// datas
let DATA = {
    place: 'Japan',
};

/**
 * ERROR Wrapper
 */

async function fetchWrapper(url, cb) {
    const res = await fetch(url)
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    } else {
        return await cb(res)
    }   
}

/**
 * HOURS API (what time is it?)
 */
async function getTime() { 
    await fetchWrapper(`https://api.jaunebleu.co/Get/hour`, res => res.text())
        .then(res => {
            const regex = /T[0-9]{2}/g;
            const hour = parseFloat(res.match(regex)[0].substring(1));
            DATA.time = hour >= 22 ? 'night' 
                : hour >= 18 ? 'evening' 
                : hour >= 14 ? 'afternoon' 
                : hour >= 12 ? 'noon' 
                : hour >= 6 ? 'morning' 
                : 'night';
        }).catch(e => console.log(e));
};

/**
 * WEATHER API (weather & temperature)
 */
async function getWeather() { 
    await fetchWrapper(`https://api.jaunebleu.co/Get/weather`, res => res.json())
        .then(res => {  
            DATA.weather = res.weather[0].description;
            DATA.temperature = Math.round(res.main.temp);
        }).catch(e => console.log(e));
};

/**
 * TRAFFIC API (subway state)
 */
async function getTraffic() { 
    await fetchWrapper(`https://api.jaunebleu.co/Get/subway`, res => res.json())
        .then(res => {
            const wording = {
                normal: "OK",
                nok: "disturbed",
                "hors-service": "out for now"
            };

            DATA.traffic = wording[res.result.slug] || wording['nok'];
        }).catch(e => console.log(e));
};

/**
 * SPOTIFY API (last listening)
 */
async function getMusic() { 
    await fetchWrapper(`https://api.jaunebleu.co/Get/music`, res => res.json())
        .then(res => {
            const mainArtist = res.artist.split(', ')[0]; // get main artist onl
            DATA.music = res.track_name.charAt(0).toUpperCase() + res.track_name.slice(1); // capitalize first letter
            DATA.artist = mainArtist.charAt(0).toUpperCase() + mainArtist.slice(1); // same
        }).catch(e => console.log(e));
};

/**
 * POCKET API (last read articles)
 */
async function getPocketArticles() {
    await fetchWrapper(`https://api.jaunebleu.co/Get/pocket?count=10`, res => res.json())
        .then(res =>{
            DATA.readings = Object.values(res.list)
                .filter(art => art.tags && art.tags.hasOwnProperty('dev')) //dev tag only
                .sort((a, b) => a.time_added - b.time_added) // ordered by saved time
                .reverse() // last first
                .slice(0, 4) // max 4 articles
                .map(art => { // content
                    return {
                        title: art.resolved_title,
                        author: art.authors ? ` ${Object.values(art.authors)[0].name}`: '',
                        website: art.given_url.match(/^https?\:\/\/(?!(?:www\.)?(?:youtube\.com|youtu\.be))([^\/:?#]+)(?:[\/:?#]|$)/i)[1].replace(/^www\./,'')
                    }
                })
        }).catch(e => console.log(e));
    }

/**
 * README GENERATION
 */
async function renderMustrache() {
    fs.readFile(MUSTACHE_MAIN_DIR, (err, data) =>  {
        if (err) throw err;
        const output = Mustache.render(data.toString(), DATA);
        fs.writeFileSync('README.md', output);
    });
}

/**
 * GLOABAL GENERATOR (composed by all API getters)
 */
async function generate() {
    await getTime();
    await getWeather();
    await getTraffic();
    await getMusic();
    await getPocketArticles();
    await renderMustrache();
}

/**
 * INIT ACTION
 */
generate()
