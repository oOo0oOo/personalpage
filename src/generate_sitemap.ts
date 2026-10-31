// Generate a sitemap.txt file for the site.
// Only real pages on this host: crawlers ignore #fragments, and sitemaps are
// per host, so projects on other domains belong in llms.txt instead.

import { writeFileSync } from 'fs';
import { Config } from './config';
const config: Config = require('../static/config.json');

const baseUrl = "https://oli.show/";

const pages = [
    "",
    "projects.html",
    "projects.md",
    "llms.txt",
    // Additional projects hosted on this domain
    ...config.HOSTED_PROJECTS,
];

writeFileSync('sitemap.txt', pages.map((page) => baseUrl + page).join("\n") + "\n");
