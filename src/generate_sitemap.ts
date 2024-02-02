// Generate a sitemap.txt file for the site

import { writeFileSync } from 'fs';
import { Config } from './config';
const config: Config = require('../static/config.json');

const baseUrl = "https://www.oli.show/";

// Portfolio page
let sitemapContent = baseUrl + "#\n";
for (const category of config.CONTENT){
    sitemapContent += baseUrl + "#" + category.id + "\n";
    for (const project of category.projects){
        sitemapContent += baseUrl + "#" + category.id + "_" + project.id + "\n";
    }
}

// Additional projects hosted on this domain
for (const project of config.HOSTED_PROJECTS){
    sitemapContent += baseUrl + project + "\n";
}

writeFileSync('sitemap.txt', sitemapContent);