import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const get = name => readFileSync(new URL(name, import.meta.url), "utf8");
const sandbox = {window: {}};
runInNewContext(get("content.js"), sandbox);
const {chapters, playbooks, terms, guides} = sandbox.window.handbook;
const routes = [...chapters, ...playbooks].map(([id]) => id);
assert.equal(new Set(routes).size, routes.length);
assert.equal(chapters.length, 16);
assert.equal(playbooks.length, 16);
assert.equal(playbooks.filter(row => row[4] === "core").length, 10);
assert.equal(playbooks.filter(row => row[4] === "dark").length, 4);
assert.deepEqual(Array.from(playbooks, row => row[6]), Array.from({length: 16}, (_, i) => i * 2 + 1));
for (const [id, , , , first, last] of chapters) assert(first <= last, id);
for (const id of Object.keys(guides)) assert(routes.includes(id), id);
assert(terms.some(([english, chinese]) => english === "Debt" && chinese === "人情"));
assert(!get("draft-data.js").includes("window.localDraft"));
for (const asset of get("index.html").matchAll(/(?:src|href)="\.\/([^"]+)"/g)) get(asset[1]);
if (process.argv.includes("--local")) {
  runInNewContext(get("local-preview/draft-data.js"), sandbox);
  const draft = sandbox.window.localDraft;
  assert.equal(Object.keys(draft.chapters).length, 12);
  assert.equal(Object.keys(draft.playbooks).length, 16);
  for (const id of Object.keys(draft.chapters)) assert(routes.includes(id), id);
  for (const id of Object.keys(draft.playbooks)) assert(routes.includes(id), id);
  for (const filename of ["basic-moves-zh.pdf", "playbooks-zh.pdf"]) {
    assert.equal(readFileSync(new URL("local-preview/" + filename, import.meta.url)).subarray(0, 5).toString(), "%PDF-");
  }
}
console.log("Verified chapter routes, playbooks, terminology, and edition scope.");

