(() => {
  "use strict";
  const {chapters, playbooks, terms, guides, gaps} = window.handbook;
  const draft = window.localDraft;
  const tags = {core: "一版核心", dark: "黑街", extra: "其他擴充"};
  const pages = {home: "城市之影", players: "玩家手冊", mc: "主持人工作台", progress: "翻譯進度", sources: "來源與校訂", glossary: "術語表", search: "搜尋結果"};
  const lookup = Object.fromEntries([...chapters, ...playbooks].map(row => [row[0], row]));
  const playbookIds = new Set(playbooks.map(row => row[0]));
  const title = document.querySelector("#title");
  const intro = document.querySelector("#intro");
  const article = document.querySelector("#article");
  const contents = document.querySelector("#contents");
  const search = document.querySelector("#search");

  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, val);
    return node;
  }

  function link(text, route, attrs = {}) {
    return el("a", text, {href: "#" + route, ...attrs});
  }

  function card(title, detail, id) {
    const node = link("", id, {class: "card"});
    node.append(el("strong", title), el("span", detail));
    return node;
  }

  function cards(rows) {
    const grid = el("div", "", {class: "cards"});
    grid.append(...rows.map(row => card(...row)));
    return grid;
  }

  function table(headers, rows) {
    const wrapper = el("div", "", {class: "table"});
    const grid = el("table");
    const head = el("thead");
    const body = el("tbody");
    const heading = el("tr");
    heading.append(...headers.map(text => el("th", text, {scope: "col"})));
    head.append(heading);
    for (const row of rows) {
      const tr = el("tr");
      for (const cell of row) {
        const td = el("td");
        td.append(cell);
        tr.append(td);
      }
      body.append(tr);
    }
    grid.append(head, body);
    wrapper.append(grid);
    return wrapper;
  }

  function draftNotice() {
    return el("p", draft
      ? "本機校對版已載入既有 Word 譯稿與兩份中文 PDF。收錄狀態以原稿為準。"
      : "公開版提供查閱導引、術語與翻譯進度。既有譯稿可在本機校對版閱讀。", {class: "callout"});
  }

  function entryCards(group) {
    return cards(chapters.filter(row => row[6] === group).map(([id, name, english, source]) => [name, tags[source] + " · " + english, id]));
  }

  function playbookCards(source) {
    return cards(playbooks.filter(row => row[4] === source).map(([id, name, english, faction]) => [name, faction + " · " + english, id]));
  }

  function draftSection(id, sections) {
    const block = el("div");
    const toc = el("ul", "", {class: "toc"});
    for (const part of sections) {
      const anchor = "section-" + part.id;
      toc.append(el("li"));
      toc.lastChild.append(link(part.title, id + "/" + anchor));
    }
    if (sections.length > 1) block.append(el("h2", "本章譯稿目錄"), toc);
    for (const part of sections) {
      const section = el("section", "", {id: "section-" + part.id, class: "section"});
      section.append(el("h2", part.title), el("p", part.status || "既有 Word 譯稿 · 待逐段對照", {class: "source"}));
      for (const [kind, text] of part.blocks) {
        section.append(el(kind === "heading" ? "h3" : "p", text));
      }
      block.append(section);
    }
    return block;
  }

  function renderChapter(id) {
    const [, name, english, source, first, last, , state] = lookup[id];
    const sections = draft?.chapters[id] ?? [];
    intro.textContent = english + " · " + tags[source] + "印刷頁碼 " + first + "–" + last + " · " + state;
    if (id === "archetypes" || id === "dark-playbooks") article.append(playbookCards(id === "archetypes" ? "core" : "dark"));
    if (id === "archetypes") article.append(el("h2", "其他擴充扮演書"), playbookCards("extra"));
    if (id === "moves" && draft) article.append(el("p"));
    if (id === "moves" && draft) article.lastChild.append(el("a", "開啟既有中文動作總表 PDF", {href: "./basic-moves-zh.pdf"}));
    if (guides[id]) for (const [heading, para] of guides[id]) article.append(el("h2", heading), el("p", para));
    if (gaps[id]) article.append(el("p", "已知缺節 · " + gaps[id].join("、"), {class: "callout"}));
    if (sections.length) article.append(draftSection(id, sections));
    else if (!guides[id] && !id.endsWith("playbooks") && id !== "archetypes") article.append(el("p", name + "的譯文待收錄。"));
  }

  function renderPlaybook(id) {
    const [, , english, faction, source, first, pdf] = lookup[id];
    intro.textContent = english + " · " + faction + "陣營 · " + tags[source] + (first ? " · 原書印刷頁 " + first : " · 英文出處待核對");
    if (draft) {
      const paragraph = el("p");
      paragraph.append(el("a", "開啟既有中文扮演書 PDF（第 " + pdf + "–" + (pdf + 1) + " 頁）", {href: "./playbooks-zh.pdf#page=" + pdf}));
      article.append(paragraph);
      if (draft.playbooks[id]) article.append(draftSection(id, [draft.playbooks[id]]));
    } else {
      article.append(el("p", "本機校對版收錄這份扮演書的既有中文卡。"));
    }
    article.append(link(source === "dark" ? "返回《黑街》扮演書" : "返回原型與扮演書", source === "dark" ? "dark-playbooks" : "archetypes"));
  }

  function renderSearch(query) {
    search.value = query;
    const normalized = query.normalize("NFKC").toLowerCase().trim();
    if (!normalized) {
      intro.textContent = "輸入中文或英文關鍵字。";
      return;
    }
    const tokens = normalized.split(/\s+/);
    const matches = text => {
      const lower = text.normalize("NFKC").toLowerCase();
      return tokens.every(token => lower.includes(token));
    };
    const rows = Object.values(lookup).filter(row => matches(row.slice(1, 4).join(" ") + " " + (guides[row[0]] || []).flat().join(" ")))
      .map(row => [row[1], row[2], row[0]]);
    for (const [english, chinese] of terms) {
      if (matches(english + " " + chinese)) rows.push([chinese, english + " · 術語表", "glossary"]);
    }
    for (const [id, sections] of Object.entries(draft?.chapters ?? {})) {
      for (const part of sections) {
        if (matches(part.title + " " + part.blocks.map(([, text]) => text).join(" "))) {
          rows.push([part.title, lookup[id][1] + " · Word 譯稿", id + "/section-" + part.id]);
        }
      }
    }
    for (const [id, part] of Object.entries(draft?.playbooks ?? {})) {
      if (matches(part.title + " " + part.blocks.map(([, text]) => text).join(" "))) rows.push([part.title, "扮演書 · Word 譯稿", id]);
    }
    intro.textContent = "「" + query + "」共 " + rows.length + " 筆結果";
    article.append(rows.length ? cards(rows) : el("p", "可以試試「動作」、「派系」、「人情」，或用英文原名搜尋。"));
  }

  function sidebar(id) {
    const group = chapters.some(row => row[0] === id && row[6] === "mc") || id === "mc" ? "mc" : "players";
    const details = el("details");
    if (matchMedia("(min-width: 49rem)").matches) details.open = true;
    details.append(el("summary", group === "mc" ? "主持人章節" : "玩家章節"));
    const list = el("ul", "", {class: "contents"});
    const items = chapters.filter(row => row[6] === group).map(row => [row[0], row[1]]);
    items.push(["glossary", "術語表"], ["sources", "來源與校訂"]);
    for (const [route, name] of items) {
      const li = el("li");
      li.append(link(name, route, id === route ? {"aria-current": "page"} : {}));
      list.append(li);
    }
    details.append(list);
    contents.replaceChildren(details);
    for (const navLink of document.querySelectorAll("header nav a")) {
      const active = navLink.hash === "#" + id || (lookup[id] && navLink.hash === "#" + group);
      if (active) navLink.setAttribute("aria-current", "page");
      else navLink.removeAttribute("aria-current");
    }
  }

  function render() {
    const [route = "", extra = ""] = location.hash.slice(1).split("/");
    const known = Object.hasOwn(pages, route) || Object.hasOwn(lookup, route);
    const id = known ? route : "home";
    title.textContent = pages[id] || lookup[id][1];
    document.title = id === "home" ? "城市之影｜一版繁體中文手冊" : title.textContent + "｜城市之影一版";
    article.replaceChildren();
    if (id === "home") {
      intro.textContent = "用繁體中文查閱城市奇幻 TRPG《城市之影》第一版。";
      article.append(cards([["玩家手冊", "創角、動作和扮演書", "players"], ["主持人工作台", "第一次聚會、威脅與風暴", "mc"], ["翻譯進度", "核心書與《黑街》的章節覆蓋", "progress"]]), draftNotice());
    } else if (id === "players" || id === "mc") {
      intro.textContent = id === "players" ? "從常用動作、創角及扮演書查起。" : "依首次聚會、主持原則、威脅和風暴查找。";
      article.append(entryCards(id), draftNotice());
    } else if (id === "progress") {
      intro.textContent = "先記錄各章是否有中文稿，再逐段核對原文及遊戲數值。";
      article.append(table(["章節", "原書印刷頁", "現有資料"], chapters.map(([slug, name, , source, first, last, , status]) => [link(name, slug), tags[source] + " " + first + "–" + last, status])));
    } else if (id === "glossary") {
      intro.textContent = "優先沿用一版既有中文稿與動作表，校對時以一版印刷規則和可驗證的勘誤為準。";
      article.append(table(["英文", "中文"], terms));
    } else if (id === "sources") {
      intro.textContent = "一版英文核心書、《黑街》擴充及既有的繁體中文資料。";
      const links = el("ul");
      for (const [label, href] of [
        ["game-doc-template", "https://github.com/wayne930242/game-doc-template"],
        ["Root RPG 玩家手冊", "https://eagle0425.github.io/root-rpg-player-reference/"],
        ["Epyllion 繁體中文手冊", "https://eagle0425.github.io/epyllion-zh-tw-reference/"],
        ["Magpie Games", "https://magpiegames.com/collections/urban-shadows"]
      ]) {
        const item = el("li");
        item.append(el("a", label, {href}));
        links.append(item);
      }
      article.append(el("h2", "校訂基準"), el("p", "核心書使用 2015 年一版 PDF，《黑街》使用 2017 年 PDF。既有資料包含 Word 規則書翻譯參考、中文動作速查表與 16 份中文扮演書。"), el("p", "頁碼按書內印刷頁記錄。譯稿空節、譯名分歧、未對齊的原文段落會另外標記。"), el("h2", "參考網站與出版資訊"), links);
    } else if (id === "search") {
      let query = "";
      try { query = decodeURIComponent(extra); } catch {}
      renderSearch(query);
    } else if (playbookIds.has(id)) renderPlaybook(id);
    else renderChapter(id);

    sidebar(id);
    const target = document.getElementById(extra);
    if (target && id !== "search") requestAnimationFrame(() => target.scrollIntoView());
    else if (route && route !== "main") {
      window.scrollTo(0, 0);
      title.focus({preventScroll: true});
    }
  }

  document.querySelector("#search-form").addEventListener("submit", event => {
    event.preventDefault();
    const route = "#search/" + encodeURIComponent(search.value.trim());
    if (location.hash === route) render();
    else location.hash = route;
  });
  addEventListener("hashchange", render);
  render();
})();

