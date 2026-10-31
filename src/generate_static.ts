// Generate the static, crawlable renderings of the content the WebGL scene
// shows, all from static/config.json:
//   projects.html  text version for browsers and search engines
//   projects.md    the same content as Markdown, for agents
//   llms.txt       index for language models (https://llmstxt.org)
//   index.html     JSON-LD and a static project list, injected between markers
// Keeps the site indexable and readable by tools that do not run JavaScript.

import { readFileSync, writeFileSync } from 'fs';
import { Config } from './config';
const config: Config = require('../static/config.json');

type Category = Config["CONTENT"][number];
type Project = Category["projects"][number];

const baseUrl = "https://oli.show/";

// Honeypot for crawlers that ignore robots.txt (/archive/ is disallowed there
// and tarpitted at the edge). Hidden from humans and assistive technology.
const honeypot = `<a href="/archive/" hidden aria-hidden="true" tabindex="-1" rel="nofollow">Archive</a>`;
const personId = baseUrl + "#person";

// Descriptions use in-page anchors (#work_phd) that only resolve on the
// main page, so point them back at it.
function rewriteAnchors(html: string): string {
    return html.replace(/href='#/g, "href='/#").replace(/href="#/g, 'href="/#');
}

function escapeAttr(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Relative links ("#work_phd") become absolute links into projects.html.
function absoluteUrl(url: string): string {
    return url.startsWith("#") ? baseUrl + "projects.html" + url : url;
}

const anchorTag = /<a\s[^>]*?href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/g;

// Description HTML (only <a>, <br>, <ul>, <li> occur) to Markdown. Entities
// are left alone: Markdown decodes them, and the contact address stays as
// obfuscated as it is in the HTML.
function toMarkdown(html: string): string {
    return html
        .replace(anchorTag, (_, _q, url, text) => `[${text}](${absoluteUrl(url)})`)
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<ul>/g, "\n")
        .replace(/<li>/g, "\n- ")
        .replace(/<\/ul>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function decodeEntities(text: string): string {
    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Description HTML to a single line of plain text.
function toPlain(html: string): string {
    return decodeEntities(html
        .replace(anchorTag, (_, _q, _url, text) => text)
        .replace(/<\/li>\s*<li>/g, "; ")
        .replace(/<br\s*\/?>|<li>/g, " ")
        .replace(/<[^>]+>/g, ""))
        .replace(/\s+/g, " ")
        .trim();
}

// First paragraph of a description, as plain text.
// A paragraph that introduces a list ("...during my PhD:") keeps the list.
function summary(html: string): string {
    const first = toPlain(html.split(/<br\s*\/?>\s*<br\s*\/?>/)[0]);
    return first.endsWith(":") ? toPlain(html) : first;
}

function technologyTitles(project: Project): string[] {
    return (project.technologies || []).map((id) => {
        const tech = config.TECHNOLOGIES.find((t) => t.id === id);
        return tech?.title || id;
    });
}

// JSON for a <script> element: "</script>" must not appear inside.
function jsonLd(data: object, indent: string): string {
    const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
    return `${indent}<script type="application/ld+json">\n${json.replace(/^/gm, indent + "  ")}\n${indent}</script>`;
}

const about = config.CONTENT.find((c) => c.id === "about");
const biography = about?.projects.find((p) => p.id === "biography");
if (!biography) throw new Error("config.json has no about/biography entry");

// "Software engineer with a PhD from ETH Zürich. I build ..." and
// "Located in Switzerland.": the biography without greeting and pointer.
const bioParagraphs = biography.description.split(/<br\s*\/?>\s*<br\s*\/?>/);
const bioSummary = bioParagraphs.slice(1, 3).map(toPlain).join(" ");

// Project categories proper, without the about section.
const projectCategories = config.CONTENT.filter((c) => c.id !== "about");

// The same project can appear in two categories (Proof of Groove); list it once.
function uniqueProjects(): { category: Category; project: Project }[] {
    const seen = new Set<string>();
    const result = [];
    for (const category of projectCategories) {
        for (const project of category.projects) {
            const key = project.title + "|" + (project.link?.url || "");
            if (seen.has(key)) continue;
            seen.add(key);
            result.push({ category, project });
        }
    }
    return result;
}

function projectUrl(category: Category, project: Project): string {
    return project.link ? absoluteUrl(project.link.url) : baseUrl + "projects.html#" + category.id + "_" + project.id;
}

// --- projects.html ---

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
            sections += `          <p class="tech">${technologyTitles(project).join(" · ")}</p>\n`;
        }

        if (project.link) {
            sections += `          <p><a href="${escapeAttr(project.link.url)}">${project.link.text}</a></p>\n`;
        }

        sections += `        </article>\n`;
    }

    sections += `      </section>\n`;
}

const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Projects by Oliver Dressler",
    "url": baseUrl + "projects.html",
    "itemListElement": uniqueProjects().map(({ category, project }, i) => {
        const url = projectUrl(category, project);
        const isRepository = url.startsWith("https://github.com/");
        return {
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": isRepository ? "SoftwareSourceCode" : "CreativeWork",
                "name": project.title,
                "url": url,
                ...(isRepository ? { "codeRepository": url } : {}),
                "description": toPlain(project.description),
                "author": { "@type": "Person", "@id": personId, "name": "Oliver Dressler" },
            },
        };
    }),
};

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
    <link href="/projects.md" rel="alternate" type="text/markdown" />
${jsonLd(itemList, "    ")}
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
        Also available as <a href="/projects.md">Markdown</a>.
      </p>
${sections}    </main>
    ${honeypot}
  </body>
</html>
`;

writeFileSync('projects.html', page);

// --- projects.md ---

let markdown = `# Oliver Dressler: Projects

> ${bioSummary}

Text version of ${baseUrl}, which renders the same content as an interactive 3D scene.
HTML version: ${baseUrl}projects.html. Raw data: ${baseUrl}static/config.json.
`;

for (const category of config.CONTENT) {
    markdown += `\n## ${category.title}\n`;
    for (const project of category.projects) {
        markdown += `\n### ${project.title}\n\n${toMarkdown(project.description)}\n`;
        if (project.highlights) {
            markdown += "\n" + project.highlights.map((h) => `- ${toMarkdown(h)}`).join("\n") + "\n";
        }
        if (project.technologies) {
            markdown += `\nTechnologies: ${technologyTitles(project).join(", ")}\n`;
        }
        if (project.link) {
            markdown += `\nLink: [${project.link.text}](${absoluteUrl(project.link.url)})\n`;
        }
    }
}

writeFileSync('projects.md', markdown);

// --- llms.txt ---

let llms = `# Oliver Dressler

> ${bioSummary}

${baseUrl} is Oliver's portfolio. The homepage is an interactive 3D scene (WebGL); the same content is available as plain text below.

## Work with Oliver

Open to freelance, contract and advising work: AI agents and MCP servers, Lean 4 and machine-checked mathematics, ChatGPT apps, machine learning and quantitative systems, lab and instrument automation.

- Email: work@oli.show
- Signal: [notquiteoliver.01](https://signal.me/#eu/D0UDRjo6cTHMOHcPG6fT2-EjoXjA_5vzpsybGPidlw2cEn61xPlGdrExAYpLPO_b), Oliver's AI assistant [Not Quite Oliver](${baseUrl}assistant/): it answers questions about his public work and passes messages on to him

## This site

- [Projects (Markdown)](${baseUrl}projects.md): every project, work and music entry with description, highlights, technologies and links
- [Projects (HTML)](${baseUrl}projects.html): the same content as a web page
- [config.json](${baseUrl}static/config.json): raw data the scene and both text versions are built from
`;

const listed = uniqueProjects();
for (const category of projectCategories) {
    const entries = listed.filter((e) => e.category === category);
    llms += `\n## ${category.title}\n\n`;
    llms += entries.map(({ project }) =>
        `- [${project.title}](${projectUrl(category, project)}): ${summary(project.description)}`).join("\n") + "\n";
}

// Hosted pages without an entry of their own.
const linked = new Set(listed.map(({ category, project }) => projectUrl(category, project)));
llms += `\n## Optional\n\n`;
llms += config.HOSTED_PROJECTS.filter((path) => !linked.has(baseUrl + path)).map((path) => `- [${baseUrl}${path}](${baseUrl}${path})`).join("\n") + "\n";

writeFileSync('llms.txt', llms);

// --- index.html ---

const person = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Person",
            "@id": personId,
            "name": "Oliver Dressler",
            "url": baseUrl,
            "description": bioSummary,
            "jobTitle": "Software Engineer",
            "alumniOf": { "@type": "CollegeOrUniversity", "name": "ETH Zürich" },
            "address": { "@type": "PostalAddress", "addressCountry": "CH" },
            "sameAs": [
                "https://github.com/oOo0oOo",
                "https://www.researchgate.net/scientific-contributions/Oliver-J-Dressler-2036925851",
                "https://www.ffhs.ch/en/ffhs/people-finder/person/dressler-oliver",
            ],
        },
        {
            "@type": "WebSite",
            "@id": baseUrl + "#website",
            "name": "oli.show",
            "url": baseUrl,
            "author": { "@id": personId },
        },
    ],
};

let siteIndex = `    <nav id="site_index" aria-label="Projects">
      <h1>Oliver Dressler</h1>
      <p>${escapeAttr(bioSummary)}</p>
      <p>Text versions: <a href="projects.html">projects.html</a> · <a href="projects.md">projects.md</a> · <a href="llms.txt">llms.txt</a></p>
`;
for (const category of projectCategories) {
    siteIndex += `      <h2>${category.title}</h2>\n      <ul>\n`;
    for (const project of category.projects) {
        siteIndex += `        <li><a href="${escapeAttr(projectUrl(category, project))}">${project.title}</a>: ${escapeAttr(summary(project.description))}</li>\n`;
    }
    siteIndex += `      </ul>\n`;
}
siteIndex += `    </nav>\n    ${honeypot}`;

function inject(html: string, marker: string, content: string): string {
    const pattern = new RegExp(`(<!-- ${marker}:start -->)[\\s\\S]*?(<!-- ${marker}:end -->)`);
    if (!pattern.test(html)) throw new Error(`index.html is missing the ${marker} markers`);
    return html.replace(pattern, (_, start, end) => start + "\n" + content + "\n    " + end);
}

let index = readFileSync('index.html', 'utf8');
index = inject(index, "jsonld", jsonLd(person, "    "));
index = inject(index, "site-index", siteIndex);
writeFileSync('index.html', index);
