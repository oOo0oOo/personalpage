// Generate projects.html: a static, crawlable rendering of the same content
// the WebGL scene shows. Keeps the site indexable by search engines and
// readable by tools that do not execute JavaScript.

import { writeFileSync } from 'fs';
import { Config } from './config';
const config: Config = require('../static/config.json');

const baseUrl = "https://www.oli.show/";

// Descriptions use in-page anchors (#work_phd) that only resolve on the
// main page, so point them back at it.
function rewriteAnchors(html: string): string {
    return html.replace(/href='#/g, "href='/#").replace(/href="#/g, 'href="/#');
}

function escapeAttr(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let sections = "";
for (const category of config.CONTENT) {
    sections += `      <section id="${category.id}">\n`;
    sections += `        <h2><a href="/#${category.id}">${category.title}</a></h2>\n`;

    for (const project of category.projects) {
        const anchor = category.id + "_" + project.id;
        sections += `        <article id="${anchor}">\n`;
        sections += `          <h3><a href="/#${anchor}">${project.title}</a></h3>\n`;
        sections += `          <p>${rewriteAnchors(project.description)}</p>\n`;

        if (project.highlights) {
            sections += `          <ul>\n`;
            for (const highlight of project.highlights) {
                sections += `            <li>${rewriteAnchors(highlight)}</li>\n`;
            }
            sections += `          </ul>\n`;
        }

        if (project.technologies) {
            const titles = project.technologies.map((id) => {
                const tech = config.TECHNOLOGIES.find((t) => t.id === id);
                return tech?.title || id;
            });
            sections += `          <p class="tech">${titles.join(" · ")}</p>\n`;
        }

        if (project.link) {
            sections += `          <p><a href="${escapeAttr(project.link.url)}">${project.link.text}</a></p>\n`;
        }

        sections += `        </article>\n`;
    }

    sections += `      </section>\n`;
}

const page = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Projects — Oliver Dressler</title>
    <meta name="description" content="A text listing of Oliver Dressler's software, work, games and music projects." />
    <meta name="author" content="Oliver Dressler" />
    <link href="static/media/favicon.png" rel="icon" type="image/x-icon" />
    <link href="${baseUrl}projects.html" rel="canonical" />
    <style>
      body {
        margin: 0 auto;
        padding: 40px 20px 80px 20px;
        max-width: 720px;
        background-color: #090A0F;
        color: #fafafa;
        font-family: system-ui, sans-serif;
        line-height: 1.6;
      }
      a { color: #97c2b9; }
      h1 { font-size: 2em; margin-bottom: 0; }
      h2 { margin-top: 2.5em; border-bottom: 1px solid #fafafa33; padding-bottom: 6px; }
      h2 a, h3 a { color: #fafafa; text-decoration: none; }
      h3 { margin-bottom: 0.2em; }
      article { margin-bottom: 2.5em; }
      .tech, .lede { color: #fafafa99; font-size: 0.9em; }
    </style>
  </head>
  <body>
    <main>
      <h1>Oliver Dressler</h1>
      <p class="lede">
        Software engineer, PhD ETH Zürich.
        This is a text version of <a href="/">oli.show</a>, which renders the same content as an interactive scene.
      </p>
${sections}    </main>
  </body>
</html>
`;

writeFileSync('projects.html', page);
