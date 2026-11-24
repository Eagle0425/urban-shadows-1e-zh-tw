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

  function sourcePage(book, pdfPage, label = "原書PDF頁 " + pdfPage) {
    const sourceFile = draft?.sourceFiles?.[book];
    return sourceFile
      ? el("a", label, {href: sourceFile + "#page=" + pdfPage, target: "_blank", rel: "noopener"})
      : el("span", label + "（原書未公開）", {class: "source"});
  }

  function cardPdf(label, href) {
    return draft?.publicEdition ? el("span", label + "（參考PDF未公開）", {class: "source"}) : el("a", label, {href});
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
      for (const [index, cell] of row.entries()) {
        const td = el("td");
        td.setAttribute("data-label", headers[index]);
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
      ? (draft.publicEdition ? "已公開完整繁中譯文與全文搜尋。" : "本機校對版已載入逐頁譯稿與參考資料。") + "逐頁複校 " + (draft.translationProgress?.reviewedPdfPages ?? 0) + " ／ " + (draft.pageInventory?.length ?? 445) + " 頁；中文卡差異與章名查閱另見來源與校訂。"
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
      section.append(el("h2", part.title), el("p", (part.sourceHeading ? part.sourceHeading + " · " : "") + (part.status || "既有 Word 譯稿 · 待逐段對照"), {class: "source"}));
      for (const note of part.reviewNotes ?? []) {
        const pageLabel = note.pdfPage != null ? " · PDF頁 " + note.pdfPage : note.page == null ? "" : " · 原書頁 " + note.page;
        section.append(el("p", "校訂註記" + pageLabel + "：" + note.text, {class: "callout"}));
      }
      let list = null;
      let currentPage = null;
      for (const [index, [kind, text]] of part.blocks.entries()) {
        const unit = part.alignment?.[index];
        if (unit && currentPage !== unit.pdfPage) {
          currentPage = unit.pdfPage;
          list = null;
          const marker = el("p", "", {class: "source", id: "page-" + part.id + "-" + currentPage});
          const label = unit.printedPage === null ? "原書未印頁碼 · PDF 第 " + unit.pdfPage + " 頁" : "原書" + (unit.pageNumberInferred ? "頁 " : "印刷頁 ") + unit.printedPage + (unit.pageNumberInferred ? "（依前後印刷頁推定）" : "") + " · PDF 第 " + unit.pdfPage + " 頁";
          const sourceFile = draft?.sourceFiles?.[part.sourceBook];
          marker.append(sourceFile ? el("a", label, {href: sourceFile + "#page=" + unit.pdfPage, target: "_blank", rel: "noopener"}) : label);
          section.append(marker);
        }
        const attrs = unit ? {id: unit.id, "data-page": unit.printedPage ?? "pdf-" + unit.pdfPage} : {};
        let rendered;
        if (kind === "list-item") {
          if (!list) { list = el("ul"); section.append(list); }
          rendered = el("li", text, attrs);
          list.append(rendered);
        } else {
          list = null;
          rendered = el(kind === "heading" ? "h3" : "p", text, attrs);
          section.append(rendered);
        }
        const references = part.unitReferences?.[unit?.id];
        if (references?.length) {
          const row = el("span", "查閱：", {class: "index-links"});
          for (const [position, reference] of references.entries()) {
            if (position) row.append(" · ");
            row.append(link(reference.label, reference.targetChapter + "/" + reference.targetUnitId,
              reference.note ? {title: reference.note} : {}));
          }
          rendered.append(row);
        }
      }
      block.append(section);
    }
    return block;
  }

  function chapterState([id, , , , , , , original]) {
    const sections = draft?.chapters[id] ?? [];
    const added = sections.filter(part => part.sourcePages).length;
    const reviewed = sections.filter(part => part.status?.startsWith("已校對")).length;
    if (reviewed && reviewed === sections.length) return "已逐頁複校 · " + reviewed + " 節";
    return added ? "逐頁初稿 " + added + " 節；已複校 " + reviewed + " 節，其餘待複校" : original;
  }

  function renderChapter(id) {
    const [, name, english, source, first, last] = lookup[id];
    const sections = draft?.chapters[id] ?? [];
    intro.textContent = english + " · " + tags[source] + "印刷頁碼 " + first + "–" + last + " · " + chapterState(lookup[id]);
    if (id === "archetypes" || id === "dark-playbooks") article.append(playbookCards(id === "archetypes" ? "core" : "dark"));
    if (id === "archetypes") article.append(el("h2", "其他擴充扮演書"), playbookCards("extra"));
    if (id === "moves" && draft) article.append(el("p"));
    if (id === "moves" && draft) article.lastChild.append(cardPdf("既有中文動作總表 PDF", "./basic-moves-zh.pdf"), " · ", link("中文卡差異與校訂", "sources/reference-card-differences"));
    if (guides[id]) {
      article.append(el("h2", "查閱導引"));
      for (const [heading, para] of guides[id]) article.append(el("h3", heading), el("p", para));
    }
    const remaining = (gaps[id] ?? []).filter(name => !sections.some(part => part.sourcePages && part.title === name));
    if (draft && remaining.length) article.append(el("p", "已知缺節 · " + remaining.join("、"), {class: "callout"}));
    if (sections.length) article.append(draftSection(id, sections));
    else if (!guides[id] && !id.endsWith("playbooks") && id !== "archetypes") article.append(el("p", draft ? name + "的譯文待收錄。" : "全文與原書 PDF 保留於本機校對版；此處提供查閱導引與進度。"));
  }

  function renderPlaybook(id) {
    const [, , english, faction, source, first, pdf] = lookup[id];
    intro.textContent = english + " · " + faction + "陣營 · " + tags[source] + (first ? " · 原書印刷頁 " + first : " · 英文出處待核對");
    if (draft) {
      const paragraph = el("p");
      paragraph.append(cardPdf("既有中文扮演書 PDF（第 " + pdf + "–" + (pdf + 1) + " 頁）", "./playbooks-zh.pdf#page=" + pdf));
      article.append(paragraph);
      const cardComparison = [...(draft.playbookCardComparison?.archetypes ?? []), ...(draft.playbookCardComparison?.referenceOnlyReviews ?? [])].find(entry => entry.id === id);
      if (cardComparison) paragraph.append(" · ", link(source === "extra" ? "中文卡範圍與待核項目" : "原型卡差異與校訂", "sources/section-playbook-card-" + id));
      else if (draft.playbookCardComparison) paragraph.append(" · ", link("原型卡對照進度", "sources/reference-playbook-card-differences"));
      article.append(el("p", source === "extra"
        ? "這份原型不收錄於本次兩本原書。以下為既有參考稿，未依英文來源複校。"
        : "以下載入與原書章節相同的逐頁校訂譯文。既有中文卡的規則與譯名異文，請參照校訂註記。", {class: "callout"}));
      if (draft.playbooks[id]) article.append(draftSection(id, [draft.playbooks[id]]));
      const expanded = draft.chapters["dark-playbooks"]?.find(part => part.id === "dark-" + id);
      if (expanded) article.append(link("閱讀完整《黑街》扮演書、動作解說與主持人建議", "dark-playbooks/section-" + expanded.id));
    } else {
      article.append(el("p", source === "extra" ? "本機校對版收錄既有中文參考稿；此原型不屬於本次兩本原書。" : "本機校對版收錄逐頁校訂譯文與既有中文卡。"));
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
    for (const group of draft?.basicCardComparison?.groups ?? []) {
      if (matches(group.topic + " " + group.result + " " + group.finding)) {
        rows.push(["中文卡對照：" + group.topic, "中文動作表 PDF 第 " + group.cardPdfPage + " 頁 · " + group.result,
          "sources/section-" + group.id]);
      }
    }
    for (const entry of draft?.playbookCardComparison?.archetypes ?? []) {
      const text = entry.name + " " + entry.checks.map(check => check.topic + " " + check.finding).join(" ") + " " + entry.findings.map(finding => finding.topic + " " + finding.finding).join(" ");
      if (matches(text)) rows.push(["原型卡對照：" + entry.name, "原型卡 PDF 第 " + entry.cardPdfPages.join("、") + " 頁 · 已對照", "sources/section-playbook-card-" + entry.id]);
    }
    for (const entry of draft?.playbookCardComparison?.referenceOnlyReviews ?? []) {
      const text = entry.name + " " + entry.sourceScope + " " + entry.checks.map(check => check.topic + " " + check.finding).join(" ");
      if (matches(text)) rows.push(["書外原型卡盤點：" + entry.name, "原型卡 PDF 第 " + entry.cardPdfPages.join("、") + " 頁 · " + entry.status, "sources/section-playbook-card-" + entry.id]);
    }
    for (const record of draft?.wordReferenceReviews ?? []) {
      const text = record.title + " " + record.titleDecision + " " + record.note + " " + (record.headingEvidence?.heading ?? "") + " " + record.paragraphFindings.map(finding => finding.note).join(" ");
      if (matches(text)) rows.push(["Word參考稿對照：" + record.title, record.note, "sources/section-word-" + record.id]);
    }
    for (const record of draft?.canonicalTermReviews ?? []) {
      const text = record.english + " " + record.canonicalChinese + " " + record.note + " " + record.matches.map(match => match.excerpt).join(" ") + " " + record.matchFindings.map(finding => finding.note + " " + finding.targets.map(target => target.text).join(" ")).join(" ");
      if (matches(text)) rows.push(["規範術語逐處對照：" + record.english, record.note, "sources/section-canonical-term-" + record.id]);
    }
    for (const record of draft?.outsidePatternTermReviews ?? []) {
      const text = record.english + " " + record.note + " " + record.matches.map(match => match.excerpt).join(" ") + " " + record.findings.map(finding => finding.note + " " + finding.target.text).join(" ");
      if (matches(text)) rows.push(["英文格式補查：" + record.english, record.note, "sources/section-outside-term-" + record.id]);
    }
    for (const record of draft?.pluralTermReviews ?? []) {
      const text = record.english + " " + record.note + " " + record.matches.map(match => match.excerpt).join(" ") + " " + record.findings.map(finding => finding.note + " " + finding.target.text).join(" ");
      if (matches(text)) rows.push(["英文複數補查：" + record.english, record.note, "sources/section-plural-term-" + record.id]);
    }
    for (const record of draft?.sourceTermReviews ?? []) {
      const text = record.english + " " + record.canonicalChinese + " " + record.note + " " + record.matches.map(match => match.excerpt).join(" ") + " " + record.targets.map(target => target.text).join(" ");
      if (matches(text)) rows.push(["英文術語候選對照：" + record.english, record.note, "sources/section-source-term-" + record.id]);
    }
    for (const record of draft?.systemTermReviews ?? []) {
      const text = record.english + " " + record.canonicalChinese + " " + record.text + " " + record.note;
      if (matches(text)) rows.push(["系統詞候選用途：" + record.canonicalChinese, record.note, "sources/section-" + record.id]);
    }
    for (const record of draft?.wordChapterReviews ?? []) {
      const text = record.originalWordText + " " + record.targetTitle + " " + record.headingEvidence.heading + " " + record.visualEvidence.ordinal + " " + record.note;
      if (matches(text)) rows.push(["Word章名對照：" + record.targetTitle, record.note, "sources/section-" + record.id]);
    }
    for (const scope of draft?.unframedNameScopes ?? []) {
      for (const record of scope.names) {
        if (matches(record.chinese + " " + (record.chineseAliases ?? []).join(" ") + " " + record.englishAliases.join(" ") + " " + record.role + " " + record.note)) {
          rows.push(["專名限定範圍核對：" + record.chinese, record.role + " · " + record.note, "sources/section-name-" + record.id]);
        }
      }
    }
    for (const record of draft?.termLabelRecords ?? []) {
      if (matches(record.label + " " + record.classification + " " + record.note + " " + record.ruleChecks.join(" "))) {
        rows.push(["標名用途核對：" + record.label, record.classification + " · " + record.note, "sources/section-term-label-" + record.id]);
      }
    }
    for (const record of draft?.namedReferenceRecords ?? []) {
      if (matches(record.originalText + " " + record.note + " " + record.references.map(ref => ref.label).join(" "))) {
        rows.push(["章名與章序查閱：" + record.classification, record.note, "sources/section-named-reference-" + record.id]);
      }
    }
    for (const finding of draft?.playbookCardComparison?.sharedFindings ?? []) {
      if (matches(finding.topic + " " + finding.finding)) rows.push(["原型卡共用欄位：" + finding.topic, finding.result, "sources/section-playbook-card-" + finding.id]);
    }
    for (const [id, sections] of Object.entries(draft?.chapters ?? {})) {
      for (const part of sections) {
        const sourceText = [part.sourceHeading ?? "", part.sourcePages ?? "", ...(part.reviewNotes ?? []).map(note => note.text),
          ...Object.values(part.unitReferences ?? {}).flatMap(references => references.map(reference => reference.label + " " + (reference.note ?? ""))),
          ...(part.alignment ?? []).map(unit => (unit.printedPage === null ? "" : "印刷頁 " + unit.printedPage) + " PDF頁 " + unit.pdfPage)].join(" ");
        if (matches(part.title + " " + sourceText + " " + part.blocks.map(([, text]) => text).join(" "))) {
          const origin = part.status?.startsWith("已校對") ? "已校對" : part.sourcePages ? "逐頁初稿" : "Word 譯稿";
          rows.push([part.title, lookup[id][1] + " · " + origin, id + "/section-" + part.id]);
        }
      }
    }
    const chapterSectionIds = new Set(Object.values(draft?.chapters ?? {}).flat().map(part => part.id));
    for (const [id, part] of Object.entries(draft?.playbooks ?? {})) {
      if (chapterSectionIds.has(part.id)) continue;
      if (matches(part.title + " " + part.blocks.map(([, text]) => text).join(" "))) rows.push([part.title, "扮演書 · Word 譯稿", id]);
    }
    intro.textContent = "「" + query + "」共 " + rows.length + " 筆結果";
    article.append(rows.length ? cards(rows) : el("p", "可以試試「動作」、「陣營」、「人情」，或用英文原名搜尋。"));
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

  let sourceArticle = null;
  let automaticDetails = null;

  function render() {
    const [route = "", extra = ""] = location.hash.slice(1).split("/");
    const known = Object.hasOwn(pages, route) || Object.hasOwn(lookup, route);
    const id = known ? route : "home";
    title.textContent = pages[id] || lookup[id][1];
    document.title = id === "home" ? "城市之影｜一版繁體中文手冊" : title.textContent + "｜城市之影一版";
    if (automaticDetails) { automaticDetails.open = false; automaticDetails = null; }
    if (id !== "sources" || !sourceArticle) article.replaceChildren();
    if (id === "home") {
      intro.textContent = "用繁體中文查閱城市奇幻 TRPG《城市之影》第一版。";
      article.append(cards([["玩家手冊", "創角、動作和扮演書", "players"], ["主持人工作台", "第一次聚會、威脅與風暴", "mc"], ["翻譯進度", "核心書與《黑街》的章節覆蓋", "progress"]]), draftNotice());
    } else if (id === "players" || id === "mc") {
      intro.textContent = id === "players" ? "從常用動作、創角及扮演書查起。" : "依首次聚會、主持原則、威脅和風暴查找。";
      article.append(entryCards(id), draftNotice());
    } else if (id === "progress") {
      intro.textContent = "先記錄各章是否有中文稿，再逐段核對原文及遊戲數值。";
      if (draft?.translationProgress) {
        const progress = draft.translationProgress;
        article.append(el("p", "已保存 " + progress.batchCount + " 份逐頁譯稿、" + progress.alignedUnits + " 個對齊單位（含標題與清單項目）。" + (progress.complete ? "兩書翻譯與校對已完成。" : progress.reviewComplete ? "兩書逐頁複校已完成；網站最終核對中。" : "逐頁複校及跨章總校尚在進行。"), {class: "callout"}));
        for (const exception of progress.scopeExceptions ?? []) article.append(el("p", "範圍例外：" + tags[exception.book] + " PDF 第 " + exception.pdfPage + " 頁（印刷第 " + exception.printedPage + " 頁）的" + exception.excludedElements.join("、") + "依使用者指示略過。HOTEL＝旅館已確認並保留。", {class: "callout"}));
        article.append(el("p", "已完成全頁元素與譯文複校：" + (progress.reviewedPdfPages ?? 0) + " ／ 445 個實體頁。每頁複校紀錄綁定來源及譯文雜湊；譯文變更後須重新核對。"));
      }
      article.append(table(["章節", "原書印刷頁", "現有資料"], chapters.map(row => {
        const [slug, name, , source, first, last] = row;
        return [link(name, slug), tags[source] + " " + first + "–" + last, chapterState(row)];
      })));
      if (draft?.pageInventory) article.append(el("h2", "逐頁盤點"), table(["來源", "印刷頁／PDF 頁", "譯稿", "複校"], draft.pageInventory.map(page => [tags[page.book], (page.printedPage === null ? "未印頁碼" : page.printedPage + (page.pageNumberStatus.startsWith("依序推定") ? "（推定）" : "")) + " ／ " + page.pdfPage, page.status, page.reviewStatus])));
    } else if (id === "glossary") {
      intro.textContent = "優先沿用一版既有中文稿與動作表，校對時以一版印刷規則和可驗證的勘誤為準。";
      article.append(table(["英文", "中文"], terms));
    } else if (id === "sources") {
      intro.textContent = "一版英文核心書、《黑街》擴充及既有的繁體中文資料。";
      if (sourceArticle) article.replaceChildren(...sourceArticle);
      else {
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
      if (draft?.basicCardComparison) {
        const comparison = draft.basicCardComparison;
        const noted = comparison.groups.filter(group => group.result !== "一致");
        const block = el("section", "", {id: "reference-card-differences"});
        block.append(el("h2", "中文動作表與原書對照"), el("p", "中文動作表2頁、" + comparison.groupCount + "個功能區已對照，其中" + noted.length + "區有差異或需補充說明。原卡保留；本機正文依指定一版原書校訂。原型卡另行對照。", {class: "callout"}));
        for (const group of [...noted, ...comparison.groups.filter(group => group.result === "一致")]) {
          const item = el("details", "", {id: "section-" + group.id, class: "reference-comparison"});
          if (group.result === "規則差異") item.open = true;
          item.append(el("summary", group.topic + " · " + group.result), el("p", group.finding));
          const references = el("p");
          references.append(cardPdf("原中文卡 PDF 第 " + group.cardPdfPage + " 頁", "./basic-moves-zh.pdf#page=" + group.cardPdfPage), " · ",
            link("校訂正文 · 印刷頁 " + group.canonicalPrintedPage, group.canonicalChapter + "/" + group.canonicalUnitId));
          item.append(references);
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.playbookCardComparison) {
        const comparison = draft.playbookCardComparison;
        const block = el("section", "", {id: "reference-playbook-card-differences"});
        block.append(el("h2", "中文原型卡與原書對照"), el("p", "已依兩本原書對照 " + comparison.reviewedPdfPages.length + " ／ 28 個書內原型卡PDF頁（" + comparison.archetypes.length + " 份）。另有 " + (comparison.referenceOnlyReviewedPdfPages?.length ?? 0) + " ／ 4 個書外卡頁已盤點：不死者與龍族的英文來源未核，維持參考用途。", {class: "callout"}));
        const appendFinding = (node, finding) => {
          node.append(el("h3", finding.topic + " · " + finding.result), el("p", finding.finding));
          const references = el("p");
          references.append(cardPdf("原型卡 PDF 第 " + finding.cardPdfPage + " 頁", "./playbooks-zh.pdf#page=" + finding.cardPdfPage), " · ",
            link("校訂正文 · 印刷頁 " + finding.canonicalPrintedPage, finding.canonicalChapter + "/" + finding.canonicalUnitId));
          node.append(references);
        };
        for (const finding of comparison.sharedFindings) {
          const item = el("details", "", {id: "section-playbook-card-" + finding.id, class: "reference-comparison"});
          item.append(el("summary", "共用欄位：" + finding.topic));
          appendFinding(item, finding);
          block.append(item);
        }
        for (const entry of comparison.archetypes) {
          const item = el("details", "", {id: "section-playbook-card-" + entry.id, class: "reference-comparison"});
          item.append(el("summary", entry.name + " · 原卡PDF頁 " + entry.cardPdfPages.join("、") + " · " + entry.status));
          for (const finding of entry.findings) appendFinding(item, finding);
          item.append(el("h3", "其他已核對內容"));
          const checks = el("ul");
          for (const check of entry.checks) checks.append(el("li", check.topic + "：" + check.finding));
          item.append(checks);
          block.append(item);
        }
        for (const entry of comparison.referenceOnlyReviews ?? []) {
          const item = el("details", "", {id: "section-playbook-card-" + entry.id, class: "reference-comparison"});
          item.append(el("summary", entry.name + " · 原卡PDF頁 " + entry.cardPdfPages.join("、") + " · " + entry.status),
            el("p", entry.sourceScope, {class: "callout"}));
          const references = el("p");
          for (const pdfPage of entry.cardPdfPages) {
            if (references.childNodes.length) references.append(" · ");
            references.append(cardPdf("原型卡 PDF 第 " + pdfPage + " 頁", "./playbooks-zh.pdf#page=" + pdfPage));
          }
          item.append(references);
          const checks = el("ul");
          for (const check of entry.checks) checks.append(el("li", check.topic + "：" + check.finding));
          item.append(checks);
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.namedReferenceAudit) {
        const audit = draft.namedReferenceAudit;
        const block = el("section", "", {id: "named-reference-audit"});
        block.append(el("h2", "章名、章序與具名小節查閱"), el("p", "已人工分類 " + audit.candidates + " 個章名或章節字樣候選，其中 " + audit.citations + " 筆轉介與來源歸屬提供 " + audit.links + " 個查閱位置。頁首、自指與一般詞義已另行分類；此處不代表動作名稱、術語及人名總稽核已完成。", {class: "callout"}));
        for (const record of draft.namedReferenceRecords) {
          const item = el("details", "", {id: "section-named-reference-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.classification + " · 核心PDF頁 " + record.sourcePdfPage), el("p", record.originalText), el("p", record.note));
          const references = el("p");
          references.append(link("回到原段落", record.sourceChapter + "/" + record.sourceUnitId));
          for (const ref of record.references) references.append(" · ", link(ref.label, ref.targetChapter + "/" + ref.targetUnitId, {title: ref.note}));
          item.append(references);
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.wordReferenceAudit) {
        const audit = draft.wordReferenceAudit;
        const block = el("section", "", {id: "word-reference-audit"});
        block.append(el("h2", "Word參考稿對照"), el("p", "已定位 " + audit.bookBackedSections + " 個書內小節，另 " + audit.referenceOnlySections + " 個書外原型保留參考用途。人工已核 " + audit.reviewedSections + " 個小節：" + audit.reviewedTitleOnlySections + " 個原稿僅有標題，" + audit.reviewedBodySections + " 個含正文小節已對讀 " + audit.reviewedBodyParagraphs + " 個原Word正文段；章名已核 " + audit.reviewedChapterHeadings + "／12。", {class: "callout"}));
        block.append(el("p", "原Word共 " + audit.sourceWordParagraphs + " 段（" + audit.nonemptyWordParagraphs + " 段非空）。" + audit.identicalTextParagraphs + " 段文字層相同；" + audit.differenceCandidates + " 個差異候選中已判讀 " + audit.reviewedDifferenceCandidates + " 個，尚待 " + audit.pendingDifferenceCandidates + " 個。分段或措辭差異不等於錯譯，此處不代表兩書總校已完成。", {class: "source"}));
        for (const record of draft.wordReferenceReviews) {
          const item = el("details", "", {id: "section-word-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.title + " · " + (record.reviewKind === "title-only" ? "原稿僅標題" : "正文對讀") + " · " + tags[record.sourceEvidence[0].book] + "印刷頁 " + record.targetPrintedPages), el("p", record.titleDecision), el("p", record.note));
          const findings = el("ul");
          for (const finding of record.paragraphFindings) {
            const row = el("li", finding.note);
            for (const [index, unitId] of finding.targetUnitIds.entries()) row.append(" ", link("對應譯文" + (finding.targetUnitIds.length > 1 ? " " + (index + 1) : ""), record.targetChapter + "/" + unitId));
            for (const reference of finding.targetReferences ?? []) row.append(" ", link(reference.label, reference.chapter + "/" + reference.unitId));
            findings.append(row);
          }
          if (record.paragraphFindings.length) item.append(findings);
          else item.append(link("開啟本節譯文", record.targetChapter + "/" + record.targetFirstUnitId));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.wordChapterReviews?.length) {
        const block = el("section", "", {id: "word-chapter-audit"});
        block.append(el("h2", "Word章名與原章扉對照"), el("p", "已核 " + draft.wordChapterReviews.length + "／12 個章名、章序與實際頁碼。此處只核章名；全書正文、術語及姓名總校另行記錄；核心PDF38兩處小招牌依使用者指示略過。", {class: "callout"}));
        for (const record of draft.wordChapterReviews) {
          const item = el("details", "", {id: "section-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.originalWordText + " → " + record.targetTitle), el("p", record.headingEvidence.heading + " · " + record.visualEvidence.ordinal), el("p", record.note));
          item.append(el("p", "核心印刷頁 " + record.printedPage + (record.pageNumberInferred ? "（依頁序推定）" : "") + "／PDF頁 " + record.pdfPage, {class: "source"}));
          item.append(link("開啟章扉譯文", record.chapter + "/" + record.targetUnitId), " · ", sourcePage(record.book, record.pdfPage, "原書PDF頁 " + record.pdfPage));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.canonicalTermAudit) {
        const audit = draft.canonicalTermAudit;
        const block = el("section", "", {id: "canonical-term-audit"});
        block.append(el("h2", "同頁規範術語的逐處對照"), el("p", "同頁有慣用中文的 " + audit.totalCounterpartRows + " 個詞與頁組合、" + audit.totalCounterpartMatches + " 次英文命中，已逐處對讀 " + audit.reviewedCounterpartRows + " 組／" + audit.reviewedCounterpartMatches + " 次；目前完成的詞範圍：" + audit.completedCanonicalTermScopes.join("、") + "。每次英文命中都列對應段落，包含代詞、省略、標題及普通用語的判讀。以上數字只涵蓋明列英文格式；全書判定另依逐頁、專名及其他對讀紀錄，不以此詞表單獨核准。", {class: "callout"}));
        for (const record of draft.canonicalTermReviews) {
          const item = el("details", "", {id: "section-canonical-term-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.canonicalChinese + " · " + record.english + " · " + tags[record.book] + " PDF頁 " + record.pdfPage), el("p", record.note));
          const findings = el("ol");
          for (const finding of record.matchFindings) {
            const row = el("li", "", {"data-match-index": finding.matchIndex});
            row.append(el("blockquote", record.matches[finding.matchIndex].excerpt), el("p", finding.note));
            if (finding.batchTitle) row.append(el("p", "章節標題：" + finding.batchTitle + "（" + finding.sourceHeading + "）"));
            for (const [index, target] of finding.targets.entries()) row.append(link("對應譯文 " + (index + 1), target.chapter + "/" + target.unitId), " ");
            findings.append(row);
          }
          item.append(findings, sourcePage(record.book, record.pdfPage));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.outsidePatternTermAudit) {
        const audit = draft.outsidePatternTermAudit;
        const block = el("section", "", {id: "outside-pattern-term-audit"});
        block.append(el("h2", "英文大小寫與衍生形補查"), el("p", "另外核對 " + audit.reviewedRows + " 個詞與頁組合、" + audit.reviewedMatches + " 次出現，涵蓋原盤點大小寫界限之外的同字形式，以及 MCing。小寫也可能是正式評級或陣營；每處皆列實際譯文。此為明列格式的補查，不代表全書總校完成。", {class: "callout"}));
        for (const record of draft.outsidePatternTermReviews) {
          const item = el("details", "", {id: "section-outside-term-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.english + " · " + tags[record.book] + " PDF頁 " + record.pdfPage), el("p", record.note));
          const findings = el("ol");
          for (const finding of record.findings) {
            const row = el("li", "", {"data-match-index": finding.matchIndex});
            row.append(el("blockquote", record.matches[finding.matchIndex].excerpt), el("p", finding.note), link("對應譯文", finding.target.chapter + "/" + finding.target.unitId));
            findings.append(row);
          }
          item.append(findings, sourcePage(record.book, record.pdfPage));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.pluralTermAudit) {
        const audit = draft.pluralTermAudit;
        const block = el("section", "", {id: "plural-term-audit"});
        block.append(el("h2", "英文複數與同形動詞補查"), el("p", "另外核對 " + audit.reviewedRows + " 個詞與頁組合、" + audit.reviewedMatches + " 次出現，涵蓋八個原採單數的評級與陣營名稱加 s 的形式。能力、靈體與一般權勢依原文語境判讀，另分出同形動詞；每處皆列實際譯文。此為明列格式的補查，不代表全書總校完成。", {class: "callout"}));
        for (const record of draft.pluralTermReviews) {
          const item = el("details", "", {id: "section-plural-term-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.english + " · " + tags[record.book] + " PDF頁 " + record.pdfPage), el("p", record.note));
          const findings = el("ol");
          for (const finding of record.findings) {
            const row = el("li", "", {"data-match-index": finding.matchIndex});
            row.append(el("blockquote", record.matches[finding.matchIndex].excerpt), el("p", finding.note), link("對應譯文", finding.target.chapter + "/" + finding.target.unitId));
            findings.append(row);
          }
          item.append(findings, sourcePage(record.book, record.pdfPage));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.sourceTermAudit) {
        const audit = draft.sourceTermAudit;
        const block = el("section", "", {id: "source-term-audit"});
        block.append(el("h2", "英文術語與同頁譯詞對照"), el("p", "以明列格式盤點 " + audit.glossaryTerms + " 詞，共 " + audit.sourceTermPageRows + " 個詞與頁組合、" + audit.sourceMatches + " 次英文命中。其中同頁未見慣用中文的 " + audit.missingCanonicalCounterpartRows + " 個候選、" + audit.missingCanonicalCounterpartMatches + " 次命中，已逐項對讀 " + audit.reviewedRows + " 個／" + audit.reviewedMatches + " 次。候選含頁眉、複合名稱、跨頁句和普通語義；同頁有譯詞也不保證每個命中均正確。此項不代表全書術語總校完成。", {class: "callout"}));
        for (const record of draft.sourceTermReviews) {
          const item = el("details", "", {id: "section-source-term-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.english + " · " + tags[record.book] + " PDF頁 " + record.pdfPage + " · 保留現稿"), el("p", record.note));
          for (const match of record.matches) item.append(el("blockquote", match.excerpt));
          const targets = el("p");
          for (const [index, target] of record.targets.entries()) targets.append(link("對應譯文 " + (index + 1), target.chapter + "/" + target.unitId), " ");
          targets.append(sourcePage(record.book, record.pdfPage));
          item.append(targets);block.append(item);
        }
        article.append(block);
      }
      if (draft?.systemTermAudit) {
        const audit = draft.systemTermAudit;
        const block = el("section", "", {id: "system-term-audit"});
        block.append(el("h2", "無框系統詞的候選用途"), el("p", audit.glossaryTerms + " 個系統詞的規範字樣共 " + audit.canonicalLexicalOccurrences + " 次；逐處語義核對的進度另見上方對照。另有 " + audit.variantCandidateUnits + " 個可能變體段落、" + audit.variantCandidateOccurrences + " 個字樣，已逐項判讀 " + audit.reviewedVariantUnits + " 段／" + audit.reviewedVariantOccurrences + " 個字樣。普通用語、其他系統名稱與跨詞誤命中均保留；此範圍不代表全書術語總校完成。", {class: "callout"}));
        for (const record of draft.systemTermReviews) {
          const item = el("details", "", {id: "section-" + record.id, class: "reference-comparison"});
          const candidates = [...new Set(record.matches.map(match => match.text))].join("、");
          item.append(el("summary", record.canonicalChinese + "：候選「" + candidates + "」 · 保留現稿"), el("p", record.note), el("blockquote", record.text));
          item.append(el("p", record.english + " · " + tags[record.book] + (record.printedPage === null ? "PDF頁 " + record.pdfPage : "印刷頁 " + record.printedPage + "／PDF頁 " + record.pdfPage), {class: "source"}));
          item.append(link("對應段落", record.chapter + "/" + record.unitId), " · ", sourcePage(record.book, record.pdfPage));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.unframedNameAudit) {
        const audit = draft.unframedNameAudit;
        const block = el("section", "", {id: "unframed-name-audit"});
        block.append(el("h2", "無框專名的限定範圍核對"), el("p", "目前核對 " + audit.reviewedScopes + " 個限定範圍、" + audit.reviewedNames + " 筆專名核對紀錄、" + audit.reviewedOccurrences + " 次出現。這份逐項對讀紀錄只涵蓋明列人物與用途；全書判定另依逐頁及其他對讀紀錄。", {class: "callout"}));
        for (const scope of draft.unframedNameScopes) {
          block.append(el("h3", scope.title), el("p", scope.note));
          for (const record of scope.names) {
            const item = el("details", "", {id: "section-name-" + record.id, class: "reference-comparison"});
            item.append(el("summary", record.chinese + " · " + record.englishAliases.join("／") + " · " + record.role), el("p", record.note));
            if (record.chineseAliases) item.append(el("p", "本範圍的姓名與別稱：" + record.chineseAliases.join("、") + "。長名優先比對，不在同一全名內重複計短名。"));
            if (record.excludedMatches?.length) {
              const exclusions = el("ul");
              for (const match of record.excludedMatches) {
                const row = el("li", "排除字樣「" + match.matchedChineseAlias + "」：" + match.note + " ");
                row.append(link("查看原段落", match.chapter + "/" + match.unitId));exclusions.append(row);
              }
              item.append(exclusions);
            }
            const first = record.occurrences[0];
            item.append(link("開啟首處譯文：" + (first.book === "core" ? "核心" : "黑街") + first.printedPage, first.chapter + "/" + first.unitId), el("p", "此限定範圍已核 " + record.occurrences.length + " 次出現；頁碼與段落雜湊以本機紀錄驗證。", {class: "source"}));
            block.append(item);
          }
        }
        article.append(block);
      }
      if (draft?.termLabelAudit) {
        const audit = draft.termLabelAudit;
        const block = el("section", "", {id: "term-label-audit"});
        block.append(el("h2", "動作與其他標名的跨章核對"), el("p", "【】標名共 " + audit.labels + " 種、" + audit.occurrences + " 次出現；已核對 " + audit.reviewedLabels + " 種、" + audit.reviewedOccurrences + " 次出現，尚待 " + audit.pendingLabels + " 種。標名也可能是附屬特性、裝備或自訂例子，不能一律視為基本動作；無框術語與人名另見對讀紀錄。", {class: "callout"}));
        for (const record of draft.termLabelRecords) {
          const item = el("details", "", {id: "section-term-label-" + record.id, class: "reference-comparison"});
          item.append(el("summary", record.label + " · " + record.classification), el("p", record.note));
          const checks = el("ul");
          for (const check of record.ruleChecks) checks.append(el("li", check));
          item.append(checks);
          const references = el("p", "定義：");
          for (const [index, definition] of record.definitions.entries()) {
            const context = definition.context;
            if (index) references.append(" · ");
            references.append(link((context.book === "core" ? "核心" : "黑街") + (context.printedPage ?? "PDF" + context.pdfPage) + " · " + definition.meaning, context.chapter + "/" + context.unitId));
          }
          item.append(references, el("p", "已核對 " + record.occurrences.length + " 次出現；原文、譯文與段落位置以本機紀錄雜湊驗證。", {class: "source"}));
          block.append(item);
        }
        article.append(block);
      }
      if (draft?.contentsInventory) {
        const inventory = draft.contentsInventory;
        article.append(el("h2", "原書目錄與正文對照"), el("p", "目錄起點已核對 " + inventory.mappingsReviewed + " ／ " + inventory.entries.length + " 項。原目錄數字照錄，正文欄列實際印刷頁；目錄對應通過仍須另查逐頁複校狀態。", {class: "callout"}));
        const mappingsTable = table(["原書目錄項目", "原目錄／正文頁", "本機譯稿", "核對"], inventory.entries.map(entry => {
          const label = el("div", tags[entry.book] + " · " + entry.heading);
          if (entry.bodyPrintedPage !== entry.tocPage || entry.mappingKind === "umbrella") label.append(el("p", entry.note ?? "對應待核對", {class: "source"}));
          return [label, entry.tocPage + " ／ " + (entry.bodyPrintedPage ?? "待核對"),
            entry.targetBatchId ? link("開啟對應譯稿", entry.targetChapter + "/" + entry.targetUnitId) : "待對應",
            entry.mappingStatus + " · " + entry.status];
        }));
        mappingsTable.classList.add("toc-mapping");
        article.append(mappingsTable);
      }
      sourceArticle = Array.from(article.childNodes);
      }
    } else if (id === "search") {
      let query = "";
      try { query = decodeURIComponent(extra); } catch {}
      renderSearch(query);
    } else if (playbookIds.has(id)) renderPlaybook(id);
    else renderChapter(id);

    sidebar(id);
    const target = document.getElementById(extra);
    if (target && id !== "search") {
      if (target.tagName === "DETAILS") {
        if (!target.open) automaticDetails = target;
        target.open = true;
      }
      requestAnimationFrame(() => target.scrollIntoView());
    }
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

