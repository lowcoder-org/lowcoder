const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const pages = require('../seo.json');
const images = require('../social-images.json');
const origin = 'https://sdk.lowcoder.cloud';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('every public page has distinct static search and social metadata', () => {
  const titles = new Set(), descriptions = new Set(), previews = new Set();
  for (const [route, meta] of Object.entries(pages)) {
    const dom = new JSDOM(read(meta.file));
    const doc = dom.window.document;
    const value = (key, property = false) => {
      const tags = doc.querySelectorAll(`meta[${property ? 'property' : 'name'}="${key}"]`);
      assert.equal(tags.length, 1, `${route}: one ${key}`);
      return tags[0].content;
    };
    assert.equal(doc.documentElement.lang, 'en');
    assert.equal(doc.querySelectorAll('title').length, 1);
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.equal(doc.title, meta.title);
    assert.equal(value('description'), meta.description);
    // Editorial budgets for these pages, not promises about search truncation.
    assert.ok(meta.title.length >= 35 && meta.title.length <= 60, `${route}: title length`);
    assert.ok(meta.description.length >= 120 && meta.description.length <= 160, `${route}: description length`);
    const url = origin + route;
    const image = origin + images[meta.card];
    assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
    assert.equal(doc.querySelector('link[rel="canonical"]').href, url);
    assert.equal(value('robots'), 'index, follow, max-image-preview:large');
    for (const [key, expected] of Object.entries({ title: meta.title, description: meta.description, url, image, 'image:secure_url': image, 'image:type': 'image/png', 'image:width': '1200', 'image:height': '630', 'image:alt': meta.imageAlt, type: 'website', site_name: 'Lowcoder SDK', locale: 'en_US' })) {
      assert.equal(value(`og:${key}`, true), expected, `${route}: og:${key}`);
    }
    for (const [key, expected] of Object.entries({ card: 'summary_large_image', title: meta.title, description: meta.description, image, 'image:alt': meta.imageAlt })) {
      assert.equal(value(`twitter:${key}`), expected, `${route}: twitter:${key}`);
    }
    const graph = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    const webPage = graph.find(node => node['@type'] === 'WebPage');
    const primaryImage = graph.find(node => node['@id'] === webPage.primaryImageOfPage['@id']);
    assert.equal(webPage.url, url);
    assert.equal(webPage.name, meta.title);
    assert.equal(webPage.description, meta.description);
    assert.equal(primaryImage.url, image);
    assert.equal(primaryImage.width, 1200);
    assert.equal(primaryImage.height, 630);
    for (const link of doc.querySelectorAll('a[href]')) {
      assert.doesNotMatch(link.getAttribute('href'), /^\/(guide|reference|recipes)\.html(?:[#?]|$)/, 'Internal links must use the canonical clean URL');
    }
    titles.add(meta.title); descriptions.add(meta.description); previews.add(image);
    dom.window.close();
  }
  for (const distinct of [titles, descriptions, previews]) assert.equal(distinct.size, Object.keys(pages).length);
});

test('share images are real 1200 by 630 PNGs with content-hashed URLs and a small payload', () => {
  for (const image of Object.values(images)) {
    const match = image.match(/^\/social\/[a-z-]+-([a-f0-9]{12})\.png$/);
    assert.ok(match, image);
    const bytes = fs.readFileSync(path.join(root, 'site', image));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), 1200, `${image}: width`);
    assert.equal(bytes.readUInt32BE(20), 630, `${image}: height`);
    assert.ok(bytes.length < 1024 * 1024, `${image}: under 1 MiB`);
    assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0, 12), match[1]);
  }
});

test('sitemap lists canonical content and utility pages stay out of search', () => {
  const xml = new JSDOM(read('site/sitemap.xml'), { contentType: 'text/xml' });
  assert.deepEqual([...xml.window.document.querySelectorAll('loc')].map(node => node.textContent).sort(), Object.keys(pages).map(route => origin + route).sort());
  assert.equal(xml.window.document.documentElement.namespaceURI, 'http://www.sitemaps.org/schemas/sitemap/0.9');
  xml.window.close();
  assert.match(read('site/robots.txt'), /Sitemap: https:\/\/sdk\.lowcoder\.cloud\/sitemap\.xml/);
  assert.doesNotMatch(read('site/robots.txt'), /^Disallow:\s*\//m, 'Crawlers must be able to fetch public pages and previews');
  for (const file of ['site/404.html', 'src/custom_component/custom_component.html']) {
    const dom = new JSDOM(read(file));
    assert.match(dom.window.document.querySelector('meta[name="robots"]').content, /noindex/);
    dom.window.close();
  }
});
