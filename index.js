import Mustache from "mustache";
import fs from "fs";
import fetch from 'node-fetch';
const MUSTACHE_MAIN_DIR = './template.mustache';

// datas
let DATA = {
    place: 'Versailles',
};

/**
 * HOURS API (what time is it?)
 */
async function getTime() { 
    await fetch(`https://api.jaunebleu.co/Get/hour`)
        .then(res => res.text())
        .then(res => {
            const date = new Date(res);
            DATA.time = date.getHours() > 12 ? 'afternoon' : 'morning';
        })
};

/**
 * WEATHER API (weather & temperature)
 */
async function getWeather() { 
    await fetch(`https://api.jaunebleu.co/Get/weather`)
        .then(res => res.json())
        .then(res => {
            
            DATA.weather = res.weather[0].description;
            DATA.temperature = Math.round(res.main.temp);
        })
};

/**
 * TRAFFIC API (subway state)
 */
async function getTraffic() { 
    await fetch(`https://api.jaunebleu.co/Get/subway`)
        .then(res => res.json())
        .then(res => {
            const wording = {
                normal: "OK",
                nok: "disturbed",
                "hors-service": "out for now"
            };

            DATA.traffic = wording[res.result.slug] || wording['nok'];
        })
};

/**
 * SPOTIFY API (last listening)
 */
async function getMusic() { 
    await fetch(`https://api.jaunebleu.co/Get/music`)
        .then(res => res.json())
        .then(res => {
            DATA.music = res.track_name;
            DATA.artist = res.artist;
        })
};

/**
 * POCKET API (last read articles)
 */
async function getPocketArticles() {
    await fetch(`https://api.jaunebleu.co/Get/pocket?count=10`)
        .then(res => res.json())
        .then(res =>{
            DATA.readings = Object.values(res.list)
                .filter(art => art.tags && art.tags.hasOwnProperty('dev'))
                .sort((a, b) => a.time_added - b.time_added)
                .reverse()
                .slice(0, 4)
                .map(art => {
                    return {
                        title: art.resolved_title,
                        author: art.authors ? ` ${Object.values(art.authors)[0].name}`: '',
                        website: art.given_url.match(/^https?\:\/\/(?!(?:www\.)?(?:youtube\.com|youtu\.be))([^\/:?#]+)(?:[\/:?#]|$)/i)[1]
                    }
                })
        })
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
