(() => {
  const search = document.getElementById("reference-search");
  const clear = document.getElementById("clear-search");
  const status = document.getElementById("search-status");
  const empty = document.getElementById("search-empty");
  const sections = Array.from(document.querySelectorAll("article > section"));
  const links = Array.from(document.querySelectorAll("#reference-nav a"));
  const searchable = sections.map((section) =>
    section.textContent.toLowerCase(),
  );

  function filter() {
    const terms = search.value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    let count = 0;
    sections.forEach((section, index) => {
      const matches = terms.every((term) => searchable[index].includes(term));
      section.hidden = !matches;
      links[index].hidden = !matches;
      if (matches) count++;
    });
    clear.hidden = !search.value;
    empty.hidden = count !== 0;
    status.textContent = terms.length
      ? `${count} matching ${count === 1 ? "section" : "sections"}`
      : "";
  }
  search.addEventListener("input", filter);
  clear.addEventListener("click", () => {
    search.value = "";
    filter();
    search.focus();
  });
  // A cross-reference must still reveal its target while a filter is active.
  function revealHash() {
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    if (target?.hidden && sections.includes(target)) {
      search.value = "";
      filter();
      target.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();

  document.querySelectorAll(".code-card").forEach((card, index) => {
    const pre = card.querySelector("pre");
    pre.id = `example-${index + 1}`;
    const button = document.createElement("button");
    button.className = "copy-button";
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", `Copy example ${index + 1}`);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Select code to copy";
      }
    });
    card.querySelector(".code-toolbar").appendChild(button);
  });
})();
