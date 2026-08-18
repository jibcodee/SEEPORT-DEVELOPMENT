const listEl = document.getElementById("itemsList");
const emptyStateEl = document.getElementById("emptyState");
const countEl = document.getElementById("count");
const toastEl = document.getElementById("toast");
const btnScreenshot = document.getElementById("btnScreenshot");
const btnScrape = document.getElementById("btnScrape");
const trayTabs = document.getElementById("trayTabs");
const brandLogo = document.querySelector(".brand-logo");
const trayContent = document.querySelector(".tray-content");

if (brandLogo && trayContent) {
  brandLogo.style.cursor = "pointer";
  brandLogo.addEventListener("click", () => {
    const isHidden = trayContent.style.opacity === "0";
    trayContent.style.transition = "opacity 0.2s ease";
    trayContent.style.opacity = isHidden ? "1" : "0";
    trayContent.style.pointerEvents = isHidden ? "auto" : "none";
  });
}

const TYPE_LABEL = { text: "TEXT", image: "IMAGE", link: "LINK", screenshot: "CAPTURE", table: "TABLE" };

let items = [];
let activeFilter = "all";


async function loadItems() {
  items = await idb.getAll();
  render();
}

// Live-update when background updates storage (we just reload from IDB)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.itemsCount) {
    loadItems();
  }
});

async function getActiveWebTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

btnScreenshot.addEventListener("click", () => {
  // Request host permission synchronously to preserve the user gesture
  chrome.permissions.request({
    origins: ["http://*/*", "https://*/*"]
  }, async (granted) => {
    if (!granted) {
      showToast("Failed: Access is required for screenshot.");
      return;
    }

    try {
      const tab = await getActiveWebTab();
      if (!tab) {
        showToast("This tab is not supported.");
        return;
      }
      showToast("Opening screenshot tool...");
      
      // Capture the visible tab immediately during the active gesture
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      await chrome.storage.local.set({ tempScreenshot: dataUrl });

      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["cropper.css"] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["cropper.js"] });
    } catch (err) {
      console.error("Crop inject failed:", err);
      const tab = await getActiveWebTab();
      if (tab && tab.url) {
        const isPdf = tab.url.toLowerCase().endsWith('.pdf') || tab.url.toLowerCase().includes('.pdf');
        if (isPdf) {
          showToast("PDF detected: Capturing entire screen view...");
          chrome.storage.local.get('tempScreenshot', async (data) => {
            let dataUrl = data.tempScreenshot;
            if (!dataUrl) {
              try {
                dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
              } catch (e) {
                console.error("PDF capture retry failed:", e);
              }
            }
            if (dataUrl) {
              chrome.runtime.sendMessage({ action: 'save-cropped-image', dataUrl: dataUrl }, (res) => {
                if (res && res.success) {
                  showToast("PDF screenshot captured successfully!");
                } else {
                  showToast("Failed to save PDF image.");
                }
              });
            } else {
              if (tab.url.startsWith("file:///")) {
                showToast("Please enable 'Allow access to file URLs' in extension settings.");
              } else {
                showToast("Failed to capture PDF.");
              }
            }
          });
          return;
        }
        if (tab.url.startsWith("file:///")) {
          showToast("Please enable 'Allow access to file URLs' in extension settings.");
          return;
        }
      }
      showToast("Failed: " + err.message);
    }
  });
});

btnScrape.addEventListener("click", () => {
  chrome.permissions.request({
    origins: ["http://*/*", "https://*/*"]
  }, async (granted) => {
    if (!granted) {
      showToast("Failed: Access is required to scrape tables.");
      return;
    }

    try {
      const tab = await getActiveWebTab();
      if (!tab) {
        showToast("This tab is not supported.");
        return;
      }
      showToast("Opening table scraper...");
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["box-scraper.css"] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["box-scraper.js"] });
    } catch (err) {
      console.error("Scrape inject failed:", err);
      const tab = await getActiveWebTab();
      if (tab && tab.url && tab.url.startsWith("file:///")) {
        showToast("Please enable 'Allow access to file URLs' in extension settings.");
        return;
      }
      showToast("Failed: " + err.message);
    }
  });
});

// Tab filter listeners
trayTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tray-tab");
  if (!btn) return;
  trayTabs.querySelectorAll(".tray-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  render();
});

function render() {
  const filtered = activeFilter === "all"
    ? items
    : items.filter(i => {
        if (activeFilter === "image") return i.type === "image" || i.type === "screenshot";
        return i.type === activeFilter;
      });
  
  countEl.textContent = items.length === 0 ? "0" : `${filtered.length} / ${items.length}`;
  emptyStateEl.style.display = filtered.length === 0 ? "flex" : "none";
  listEl.innerHTML = "";

  [...filtered].reverse().forEach((item) => {
    listEl.appendChild(buildCard(item));
  });
}

function buildCard(item) {
  const li = document.createElement("li");
  li.className = "item-card";

  const tab = document.createElement("span");
  tab.className = `item-tab ${item.type}`;
  li.appendChild(tab);

  const body = document.createElement("div");
  body.className = "item-body";

  const top = document.createElement("div");
  top.className = "item-top";

  const actionsLeft = document.createElement("div");
  actionsLeft.className = "item-actions";

  const tag = document.createElement("span");
  tag.className = `item-tag type-${item.type}`;
  tag.textContent = `[${TYPE_LABEL[item.type] || item.type.toUpperCase()}]`;
  actionsLeft.appendChild(tag);

  // Rename input
  const renameInput = document.createElement("input");
  renameInput.className = "item-rename";
  renameInput.type = "text";
  renameInput.value = item.label || item.sourceTitle || "";
  renameInput.placeholder = "Name this item...";
  renameInput.addEventListener("change", async () => {
    item.label = renameInput.value.trim();
    await idb.put(item);
    showToast("Name updated!");
  });
  actionsLeft.appendChild(renameInput);
  
  top.appendChild(actionsLeft);

  const actionsRight = document.createElement("div");
  actionsRight.className = "item-actions";

  // Color picker
  const picker = document.createElement("div");
  picker.className = "color-picker";
  ['none', 'yellow', 'green', 'pink'].forEach(color => {
    const dot = document.createElement("div");
    dot.className = `color-dot ${color}`;
    dot.title = color === 'none' ? 'Default' : `${color.charAt(0).toUpperCase() + color.slice(1)} highlight`;
    dot.addEventListener("mousedown", async (e) => {
      e.preventDefault(); // Keep text selection active!
      const sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) return;
      
      const p = body.querySelector(".item-content-text");
      if (!p || !p.contains(sel.anchorNode)) return;
      
      p.contentEditable = "true";
      
      if (color === "none") {
        document.execCommand("hiliteColor", false, "transparent");
      } else {
        const hex = color === "yellow" ? "#ffe58f" : color === "green" ? "#b7eb8f" : "#ffadd2";
        document.execCommand("hiliteColor", false, hex);
      }
      
      p.contentEditable = "false";
      
      item.htmlContent = p.innerHTML;
      await idb.put(item);
    });
    picker.appendChild(dot);
  });
  actionsRight.appendChild(picker);

  if (item.sourceUrl && item.type !== "screenshot") {
    const copyCitBtn = document.createElement("button");
    copyCitBtn.className = "item-copy-btn";
    copyCitBtn.setAttribute("aria-label", "Copy Citation");
    copyCitBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    copyCitBtn.addEventListener("click", async () => {
      const style = document.getElementById("citationStyle").value;
      const citation = generateSingleCitation(item, style, 0);
      try {
        await navigator.clipboard.writeText(citation);
        showToast("Citation copied!");
      } catch(err) {
        showToast("Error copying citation");
      }
    });
    actionsRight.appendChild(copyCitBtn);
  }

  let editBtn = null;
  if (item.type === "text") {
    editBtn = document.createElement("button");
    editBtn.className = "item-copy-btn";
    editBtn.setAttribute("aria-label", "Edit this item");
    editBtn.title = "Edit this item";
    editBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    actionsRight.appendChild(editBtn);
  }

  if (item.type === "image" || item.type === "screenshot") {
    const ocrBtn = document.createElement("button");
    ocrBtn.className = "item-copy-btn";
    ocrBtn.setAttribute("aria-label", "Scan text (OCR)");
    ocrBtn.title = "Scan text (OCR)";
    ocrBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M9 22H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/><line x1="7" y1="11" x2="17" y2="11"/><line x1="7" y1="15" x2="13" y2="15"/><circle cx="16" cy="18" r="3"/><line x1="18.2" y1="20.2" x2="22" y2="24"/></svg>`;
    
    ocrBtn.addEventListener("click", async () => {
      const originalHtml = ocrBtn.innerHTML;
      ocrBtn.disabled = true;
      ocrBtn.innerHTML = `<svg class="spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`;
      
      try {
        showToast("Initializing OCR engine...");
        const worker = await Tesseract.createWorker('eng', 1, {
          workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
          corePath: chrome.runtime.getURL('tesseract/tesseract-core.js'),
          langPath: 'https://tessdata.projectnaptha.com/4.0.0/',
          workerBlobURL: false
        });

        showToast("Scanning text...");
        const imgUrl = item.imageBlobUrl || item.content;
        const { data: { text } } = await worker.recognize(imgUrl);
        await worker.terminate();

        if (!text || text.trim().length === 0) {
          showToast("No text found.");
          return;
        }

        // Create new text card with scanned text
        const newTextItem = {
          id: crypto.randomUUID(),
          type: 'text',
          content: text.trim(),
          htmlContent: `<div>${text.trim().replace(/\n/g, '<br>')}</div>`,
          sourceTitle: `OCR Scan from: ${item.sourceTitle || 'Image'}`,
          sourceUrl: item.sourceUrl || '',
          timestamp: Date.now(),
          color: 'none'
        };

        await idb.put(newTextItem);
        chrome.runtime.sendMessage({ action: 'update-badge' });
        await loadItems();
        showToast("Text scanned and added successfully!");
      } catch (err) {
        console.error("OCR failed:", err);
        showToast("OCR Error: " + err.message);
      } finally {
        ocrBtn.disabled = false;
        ocrBtn.innerHTML = originalHtml;
      }
    });
    
    actionsRight.appendChild(ocrBtn);
  }

  const copyBtn = document.createElement("button");
  copyBtn.className = "item-copy-btn";
  copyBtn.setAttribute("aria-label", "Copy this item");
  copyBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  copyBtn.addEventListener("click", () => copySingleItem(item));
  actionsRight.appendChild(copyBtn);

  const removeBtn = document.createElement("button");
  removeBtn.className = "item-remove";
  removeBtn.setAttribute("aria-label", "Remove this item");
  removeBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  removeBtn.addEventListener("click", () => removeItem(item.id));
  actionsRight.appendChild(removeBtn);

  top.appendChild(actionsRight);
  body.appendChild(top);

  if (item.type === "text") {
    const toolbar = document.createElement("div");
    toolbar.className = "rich-toolbar";
    toolbar.style.display = "none";

    // Bold Button
    const btnBold = document.createElement("button");
    btnBold.className = "rich-btn";
    btnBold.title = "Bold";
    btnBold.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`;
    btnBold.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("bold");
    });
    toolbar.appendChild(btnBold);

    // Italic Button
    const btnItalic = document.createElement("button");
    btnItalic.className = "rich-btn";
    btnItalic.title = "Italic";
    btnItalic.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`;
    btnItalic.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("italic");
    });
    toolbar.appendChild(btnItalic);

    // Paragraph Button
    const btnPara = document.createElement("button");
    btnPara.className = "rich-btn";
    btnPara.title = "Paragraph";
    btnPara.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 4H9.5a6.5 6.5 0 0 0 0 13H12v4M17 4v17M19 4v17"/></svg>`;
    btnPara.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("formatBlock", false, "p");
    });
    toolbar.appendChild(btnPara);

    // Bullet List Button
    const btnBullet = document.createElement("button");
    btnBullet.className = "rich-btn";
    btnBullet.title = "Bullet List";
    btnBullet.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
    btnBullet.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("insertUnorderedList");
    });
    toolbar.appendChild(btnBullet);

    // Numbered List Button
    const btnNumber = document.createElement("button");
    btnNumber.className = "rich-btn";
    btnNumber.title = "Numbered List";
    btnNumber.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6H2v4h2M4 18H2M4 14H2v2h2"/></svg>`;
    btnNumber.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.execCommand("insertOrderedList");
    });
    toolbar.appendChild(btnNumber);

    const p = document.createElement("div"); // Changed to div for block HTML support
    p.className = "item-content-text";
    p.title = "Click to expand / collapse";
    if (item.htmlContent) {
      p.innerHTML = item.htmlContent;
    } else {
      p.textContent = item.content;
    }
    p.addEventListener("click", () => {
      if (p.contentEditable === "true") return;
      const sel = window.getSelection();
      if (sel.toString().length > 0) return; // Do not toggle if selecting text
      p.classList.toggle("expanded");
    });

    const saveAndExit = async () => {
      if (p.contentEditable !== "true") return;
      p.contentEditable = "false";
      li.classList.remove("editing");
      toolbar.style.display = "none";
      editBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
      editBtn.title = "Edit this item";
      
      const newHtml = p.innerHTML;
      const newText = p.innerText.trim();
      
      item.htmlContent = newHtml;
      item.content = newText;
      await idb.put(item);
    };

    const enterEdit = () => {
      if (p.contentEditable === "true") return;
      p.contentEditable = "true";
      li.classList.add("editing");
      toolbar.style.display = "flex";
      editBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      editBtn.title = "Save text";
      
      p.focus();
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    };

    editBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (p.contentEditable === "true") {
        await saveAndExit();
        showToast("Text saved!");
      } else {
        enterEdit();
      }
    });

    p.addEventListener("blur", () => {
      setTimeout(async () => {
        if (p.contentEditable === "true") {
          await saveAndExit();
          showToast("Text saved!");
        }
      }, 200);
    });

    body.appendChild(toolbar);
    body.appendChild(p);
  } else if (item.type === "image" || item.type === "screenshot") {
    const img = document.createElement("img");
    img.className = "item-content-image";
    img.src = item.imageBlobUrl || item.content; // Use data URL or fallback
    img.alt = "";
    img.loading = "lazy";
    body.appendChild(img);
  } else if (item.type === "link") {
    const a = document.createElement("a");
    a.className = "item-content-link";
    a.href = item.content;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.label || item.content;
    body.appendChild(a);
  } else if (item.type === "table") {
    // Show actual table preview (max 5 rows)
    if (item.htmlContent) {
      const wrapper = document.createElement("div");
      wrapper.className = "item-table-preview";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = item.htmlContent;
      const srcTable = tempDiv.querySelector("table");
      if (srcTable) {
        // Limit rows for preview
        const previewTable = document.createElement("table");
        const rows = srcTable.querySelectorAll("tr");
        const maxRows = Math.min(rows.length, 5);
        for (let i = 0; i < maxRows; i++) {
          previewTable.appendChild(rows[i].cloneNode(true));
        }
        if (rows.length > 5) {
          const moreRow = document.createElement("tr");
          const moreCell = document.createElement("td");
          moreCell.colSpan = 99;
          moreCell.style.textAlign = "center";
          moreCell.style.color = "#5c6b62";
          moreCell.style.fontStyle = "italic";
          moreCell.textContent = `... ${rows.length - 5} more rows`;
          moreRow.appendChild(moreCell);
          previewTable.appendChild(moreRow);
        }
        wrapper.appendChild(previewTable);
      }
      body.appendChild(wrapper);
    } else {
      const p = document.createElement("p");
      p.className = "item-content-text";
      p.textContent = item.content;
      p.style.fontStyle = "italic";
      body.appendChild(p);
    }
  }

  const source = document.createElement("div");
  source.className = "item-source";
  const domain = safeHostname(item.sourceUrl);
  source.textContent = `from ${item.sourceTitle || domain || item.sourceUrl}`;
  body.appendChild(source);

  const citationStyle = document.getElementById("citationStyle").value;
  if (item.sourceUrl && item.type !== "screenshot") {
    const citationPreview = document.createElement("div");
    citationPreview.className = "item-citation-preview";
    citationPreview.style.marginTop = "6px";
    citationPreview.style.fontSize = "11px";
    citationPreview.style.color = "var(--slate)";
    citationPreview.style.backgroundColor = "rgba(69, 86, 107, 0.05)";
    citationPreview.style.padding = "6px 8px";
    citationPreview.style.borderRadius = "4px";
    citationPreview.style.borderLeft = "2px solid var(--slate)";
    citationPreview.textContent = generateSingleCitation(item, citationStyle, 0); // 0 means no index
    body.appendChild(citationPreview);
  }

  li.appendChild(body);
  return li;
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url || "";
  }
}

async function removeItem(id) {
  await idb.delete(id);
  chrome.runtime.sendMessage({ action: 'update-badge' });
  loadItems();
}

document.getElementById("clearAll").addEventListener("click", async () => {
  if (items.length === 0) return;
  if (!confirm("Clear all items in SEEPORT?")) return;
  await idb.clear();
  chrome.runtime.sendMessage({ action: 'update-badge' });
  loadItems();
  showToast("Seeport cleared");
});




let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

document.getElementById("citationStyle").addEventListener("change", () => {
  render(); // Re-render to update the citation previews in all cards
});

document.getElementById("copyCitation").addEventListener("click", async () => {
  if (items.length === 0) return showToast("Seeport is empty");
  const style = document.getElementById("citationStyle").value;
  await navigator.clipboard.writeText(buildCitation(items, style));
  showToast("Citation copied");
});

function generateSingleCitation(item, style, idx = 0) {
  const title = item.sourceTitle || safeHostname(item.sourceUrl) || "Untitled";
  const url = item.sourceUrl || "";
  const dateObj = new Date(item.timestamp);
  const dateStr = dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  
  switch (style) {
    case "apa": return `${title}. (n.d.). Retrieved ${dateStr}, from ${url}`;
    case "mla": return `"${title}." Web. ${dateStr}. <${url}>.`;
    case "chicago": return `"${title}." n.d. Accessed ${dateStr}. ${url}.`;
    case "ieee": return idx > 0 
        ? `[${idx}] "${title}." [Online]. Available: ${url}. [Accessed: ${dateStr}].` 
        : `"${title}." [Online]. Available: ${url}. [Accessed: ${dateStr}].`;
    case "harvard": return `${title} (n.d.). Available at: ${url} (Accessed: ${dateStr}).`;
    default: return `${title}. ${url}`;
  }
}

function buildCitation(list, style) {
  const uniqueItems = [];
  const seenUrls = new Set();
  list.forEach(item => {
    if (item.sourceUrl && item.type !== "screenshot" && !seenUrls.has(item.sourceUrl)) {
      seenUrls.add(item.sourceUrl);
      uniqueItems.push(item);
    }
  });

  const lines = [`References (${style.toUpperCase()}) — ${new Date().toLocaleString("en-US")}`, ""];
  
  uniqueItems.forEach((item, idx) => {
    lines.push(generateSingleCitation(item, style, idx + 1));
    lines.push("");
  });
  
  return lines.join("\n");
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function extractTableToTSV(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString;
  const table = div.querySelector('table');
  if (!table) return "Table";
  
  let tsv = "";
  for (const row of table.rows) {
    const rowData = [];
    for (const cell of row.cells) {
      let text = cell.innerText.replace(/\t|\n|\r/g, ' ').trim();
      rowData.push(text);
    }
    tsv += rowData.join('\t') + '\n';
  }
  return tsv;
}

async function copySingleItem(item) {
  try {
    if (item.type === "image" || item.type === "screenshot") {
      const blob = await dataUrlToBlob(item.imageBlobUrl || item.content);
      const pngBlob = blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    } else if (item.type === "table") {
      const blobHtml = new Blob([item.htmlContent || ""], { type: 'text/html' });
      const blobPlain = new Blob([item.tsvData || "Table data missing"], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobPlain
        })
      ]);
    } else {
      let plain = item.content;
      if (item.type === "link") {
        plain = item.content; // Just the URL
      }
      
      let htmlPayload = item.htmlContent 
        ? item.htmlContent.replace(/\s(?:class|style|id)=(["'])(?:(?!\1).)*\1/gi, '')
        : item.content.replace(/\n/g, '<br>');
        
      const htmlContent = item.type === "link" 
        ? `<a href="${item.content}" style="font-family: Arial, sans-serif; font-size: 12pt; color: black;">${item.label || item.content}</a>`
        : `<div style="font-family: Arial, sans-serif; font-size: 12pt; color: black;">${htmlPayload}</div>`;
        
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobPlain = new Blob([plain], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobPlain
        })
      ]);
    }
    showToast("Copied!");
  } catch (err) {
    console.error("Copy failed", err);
    showToast("Error copying item");
  }
}

// Handle paste (Ctrl+V) from OS clipboard (e.g., after Win+Shift+S)
document.addEventListener('paste', async (e) => {
  const clipboardItems = e.clipboardData.items;
  let imagePasted = false;
  
  for (let i = 0; i < clipboardItems.length; i++) {
    if (clipboardItems[i].type.indexOf('image') !== -1) {
      imagePasted = true;
      const blob = clipboardItems[i].getAsFile();
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const newItem = {
          id: crypto.randomUUID(),
          type: 'screenshot',
          imageBlobUrl: dataUrl,
          sourceTitle: "Clipboard Paste",
          sourceUrl: "",
          timestamp: Date.now()
        };
        await idb.put(newItem);
        chrome.runtime.sendMessage({ action: 'update-badge' });
        loadItems();
        showToast("Screenshot added!");
      };
      reader.readAsDataURL(blob);
      break; 
    }
  }
});

function htmlToMarkdown(html) {
  let md = html;
  
  // Replace formatting
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  
  // Replace lists
  md = md.replace(/<ul[^>]*>/gi, '');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  
  // Replace paragraphs and divs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities (e.g. &nbsp; &amp; &lt; &gt;)
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = md;
  return tempDiv.innerText.trim();
}

function tsvToMarkdownTable(tsv) {
  const rows = tsv.trim().split("\n").map(r => r.split("\t"));
  if (rows.length === 0 || rows[0].join("").trim() === "") return "";
  
  const mdRows = [];
  mdRows.push("| " + rows[0].join(" | ") + " |");
  mdRows.push("| " + rows[0].map(() => "---").join(" | ") + " |");
  for (let i = 1; i < rows.length; i++) {
    mdRows.push("| " + rows[i].join(" | ") + " |");
  }
  return mdRows.join("\n");
}

function generateMarkdownContent(list) {
  const mdLines = [];
  mdLines.push(`# Seeport Report - ${new Date().toLocaleString("en-US")}`);
  mdLines.push("");

  list.forEach((item, idx) => {
    const title = item.label || item.sourceTitle || `Item ${idx + 1}`;
    mdLines.push(`## ${idx + 1}. ${title}`);
    
    if (item.sourceUrl) {
      mdLines.push(`*Source: [Link](${item.sourceUrl})*`);
      mdLines.push("");
    }
    
    if (item.type === "text") {
      const md = item.htmlContent ? htmlToMarkdown(item.htmlContent) : item.content;
      mdLines.push(md);
    } else if (item.type === "image" || item.type === "screenshot") {
      const imgData = item.imageBlobUrl || item.content;
      mdLines.push(`![Image](${imgData})`);
    } else if (item.type === "link") {
      mdLines.push(`Link: [${item.content}](${item.content})`);
    } else if (item.type === "table") {
      if (item.tsvData) {
        mdLines.push(tsvToMarkdownTable(item.tsvData));
      } else if (item.content) {
        mdLines.push(item.content);
      }
    }
    
    mdLines.push("");
    mdLines.push("---");
    mdLines.push("");
  });

  // Append References
  const style = document.getElementById("citationStyle").value;
  mdLines.push(`## References (${style.toUpperCase()})`);
  mdLines.push("");
  mdLines.push(buildCitation(list, style));

  return mdLines.join("\n");
}

function generateWordContent(list) {
  const htmlLines = [];
  htmlLines.push(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Seeport Report</title>
<style>
  body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
  h1 { color: #2b3a42; border-bottom: 2px solid #2b3a42; padding-bottom: 5px; }
  h2 { color: #3f51b5; margin-top: 30px; }
  .source { font-size: 11px; color: #666; font-style: italic; margin-bottom: 15px; }
  .content-text { font-size: 12px; margin-bottom: 15px; }
  .content-text p { margin: 8px 0; }
  .content-image { max-width: 100%; height: auto; display: block; margin: 15px 0; border: 1px solid #ddd; }
  table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 11px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f5f5f5; font-weight: bold; }
  .citation-block { background-color: #f9f9f9; border-left: 3px solid #3f51b5; padding: 10px; margin-top: 15px; font-family: monospace; font-size: 11px; }
  hr { border: 0; border-top: 1px solid #eee; margin: 25px 0; }
</style>
</head>
<body>`);

  htmlLines.push(`<h1>Seeport Report</h1>`);
  htmlLines.push(`<p class="source">Generated on: ${new Date().toLocaleString("en-US")}</p>`);
  htmlLines.push(`<hr>`);

  list.forEach((item, idx) => {
    const title = item.label || item.sourceTitle || `Item ${idx + 1}`;
    htmlLines.push(`<h2>${idx + 1}. ${title}</h2>`);
    
    if (item.sourceUrl) {
      htmlLines.push(`<p class="source">Source: <a href="${item.sourceUrl}">${item.sourceTitle || item.sourceUrl}</a></p>`);
    }
    
    if (item.type === "text") {
      const content = item.htmlContent || `<div>${item.content.replace(/\n/g, '<br>')}</div>`;
      htmlLines.push(`<div class="content-text">${content}</div>`);
    } else if (item.type === "image" || item.type === "screenshot") {
      const imgData = item.imageBlobUrl || item.content;
      htmlLines.push(`<img class="content-image" src="${imgData}" alt="Image">`);
    } else if (item.type === "link") {
      htmlLines.push(`<p class="content-text">Link: <a href="${item.content}">${item.content}</a></p>`);
    } else if (item.type === "table") {
      if (item.htmlContent) {
        htmlLines.push(item.htmlContent);
      } else {
        htmlLines.push(`<p class="content-text" style="font-style: italic;">${item.content}</p>`);
      }
    }
    
    htmlLines.push(`<hr>`);
  });

  // References
  const style = document.getElementById("citationStyle").value;
  htmlLines.push(`<h2>References (${style.toUpperCase()})</h2>`);
  const citationText = buildCitation(list, style).replace(/\n/g, '<br>');
  htmlLines.push(`<div class="citation-block">${citationText}</div>`);

  htmlLines.push(`</body></html>`);
  return htmlLines.join("\n");
}

function downloadFile(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("btnExportMd").addEventListener("click", () => {
  if (items.length === 0) return showToast("Seeport is empty");
  try {
    const mdContent = generateMarkdownContent(items);
    downloadFile(mdContent, "text/markdown;charset=utf-8", "seeport_report.md");
    showToast("Markdown exported!");
  } catch (err) {
    console.error(err);
    showToast("Failed to export Markdown");
  }
});

document.getElementById("btnExportDoc").addEventListener("click", () => {
  if (items.length === 0) return showToast("Seeport is empty");
  try {
    const docContent = generateWordContent(items);
    downloadFile(docContent, "application/msword;charset=utf-8", "seeport_report.doc");
    showToast("Word exported!");
  } catch (err) {
    console.error(err);
    showToast("Failed to export Word");
  }
});

// Initialize theme
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  chrome.storage.local.get(['activeTheme'], (data) => {
    const current = data.activeTheme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    
    chrome.storage.local.set({ activeTheme: next }, () => {
      applyThemeStyles(next);
      chrome.storage.local.get(['unlockedThemes', 'activeTheme'], (data2) => {
        renderThemeGallery(data2.unlockedThemes || [], data2.activeTheme || 'light');
      });
      showToast(`Toggled to ${next} theme`);
    });
  });
});

// Settings & Theme Logic (Phase 1)
const btnSettings = document.getElementById("btnSettings");
const settingsModal = document.getElementById("settingsModal");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const themeCodeInput = document.getElementById("themeCodeInput");
const btnApplyTheme = document.getElementById("btnApplyTheme");
const themeGallery = document.getElementById("themeGallery");
const btnRestoreDefault = document.getElementById("btnRestoreDefault");

// Helper to convert hex to rgba for derived UI variables
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Clear any set custom properties on documentElement
function clearCustomThemeStyles() {
  const root = document.documentElement;
  const props = [
    '--bg', '--text-primary', '--surface', '--primary', '--primary-hover',
    '--text-secondary', '--text-muted', '--text-subtle',
    '--border', '--border-hover', '--surface-hover', '--surface-active',
    '--header-bg', '--footer-bg', '--primary-light', '--primary-subtle', '--primary-ring'
  ];
  props.forEach(prop => root.style.removeProperty(prop));
}

// Apply theme style variables dynamically
function applyThemeStyles(theme) {
  if (theme === 'light') {
    document.body.classList.remove("dark-theme");
    document.body.className.split(' ').forEach(className => {
      if (className.startsWith('theme-active-') || className.startsWith('has-animation-')) {
        document.body.classList.remove(className);
      }
    });
    const root = document.documentElement;
    const props = [
      '--bg', '--text-primary', '--surface', '--primary', '--primary-hover',
      '--text-secondary', '--text-muted', '--text-subtle',
      '--border', '--border-hover', '--surface-hover', '--surface-active',
      '--header-bg', '--footer-bg', '--primary-light', '--primary-subtle', '--primary-ring',
      '--font-family', '--border-radius'
    ];
    props.forEach(prop => root.style.removeProperty(prop));
    
    // Clear animation element
    const animDiv = document.querySelector('.tray-bg-animation');
    if (animDiv) {
      animDiv.style.removeProperty('background');
      animDiv.style.removeProperty('background-image');
      animDiv.style.removeProperty('opacity');
      animDiv.style.removeProperty('animation');
    }
    themeToggle.style.display = "inline-flex";
    return;
  }
  if (theme === 'dark') {
    document.body.classList.add("dark-theme");
    document.body.className.split(' ').forEach(className => {
      if (className.startsWith('theme-active-') || className.startsWith('has-animation-')) {
        document.body.classList.remove(className);
      }
    });
    const root = document.documentElement;
    const props = [
      '--bg', '--text-primary', '--surface', '--primary', '--primary-hover',
      '--text-secondary', '--text-muted', '--text-subtle',
      '--border', '--border-hover', '--surface-hover', '--surface-active',
      '--header-bg', '--footer-bg', '--primary-light', '--primary-subtle', '--primary-ring',
      '--font-family', '--border-radius'
    ];
    props.forEach(prop => root.style.removeProperty(prop));
    
    // Clear animation element
    const animDiv = document.querySelector('.tray-bg-animation');
    if (animDiv) {
      animDiv.style.removeProperty('background');
      animDiv.style.removeProperty('background-image');
      animDiv.style.removeProperty('opacity');
      animDiv.style.removeProperty('animation');
    }
    themeToggle.style.display = "inline-flex";
    return;
  }
  
  // Custom theme object - delegated to shared renderer
  if (themeToggle) themeToggle.style.display = "none";
  renderTheme(theme);
}

// Parent to iframe communication listener for theme previews
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'THEME_UPDATE') {
    console.log('[Extension Simulator] Received THEME_UPDATE from parent:', event.data.payload);
    applyThemeStyles(event.data.payload);
  }
});

// Load themes, populate gallery and apply active theme
async function initThemeSystem() {
  chrome.storage.local.get(['unlockedThemes', 'activeTheme'], (data) => {
    let unlocked = data.unlockedThemes || [];
    let active = data.activeTheme || 'light';
    
    // Clean up Forest Emerald theme and deduplicate unlocked themes by ID
    const initialLen = unlocked.length;
    unlocked = unlocked.filter(t => t.id !== 'theme_forest_emerald');
    const seenIds = new Set();
    unlocked = unlocked.filter(t => {
      if (!t.id || seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    if (active === 'theme_forest_emerald') {
      active = 'light';
    }
    if (unlocked.length !== initialLen || data.activeTheme === 'theme_forest_emerald') {
      chrome.storage.local.set({ unlockedThemes: unlocked, activeTheme: active });
    }
    
    // Set standard UI active state on body class (fallback)
    if (active === 'dark') {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    
    // Apply full styling details
    if (active !== 'light' && active !== 'dark') {
      const activeCustom = unlocked.find(t => t.id === active);
      if (activeCustom) {
        applyThemeStyles(activeCustom);
      } else {
        // Active theme was somehow missing, fallback to light
        applyThemeStyles('light');
        chrome.storage.local.set({ activeTheme: 'light' });
      }
    } else {
      applyThemeStyles(active);
    }
    
    renderThemeGallery(unlocked, active);
  });
}

// Render circular swatches for default and custom themes
function renderThemeGallery(unlocked, activeId) {
  themeGallery.innerHTML = "";
  
  // Deduplicate themes by ID
  const uniqueThemes = [];
  const seenIds = new Set();
  unlocked.forEach(theme => {
    if (theme && theme.id && !seenIds.has(theme.id)) {
      seenIds.add(theme.id);
      uniqueThemes.push(theme);
    }
  });
  
  // Custom unlocked theme swatches only
  uniqueThemes.forEach(theme => {
    const colors = theme.colors || {};
    const bgVal = colors['--bg-color'] || colors.background || colors['--bg'] || '#0F172A';
    const cardVal = colors['--card-bg'] || colors.cardBackground || colors['--surface'] || '#1E293B';
    const accentVal = colors['--accent-color'] || colors.accent || colors['--primary'] || '#8B5CF6';

    const swatch = createSwatch(
      theme.id, 
      bgVal, 
      cardVal, 
      accentVal, 
      activeId === theme.id, 
      theme.name,
      theme
    );
    themeGallery.appendChild(swatch);
  });
}

// Create a single swatch element
function createSwatch(id, bg, card, accent, isActive, title, themeObj = null) {
  const swatch = document.createElement("div");
  swatch.className = `theme-swatch ${isActive ? 'active' : ''}`;
  swatch.title = title;
  swatch.style.setProperty('--swatch-bg', bg);
  swatch.style.setProperty('--swatch-card', card);
  swatch.style.setProperty('--swatch-accent', accent);
  
  swatch.addEventListener("click", () => {
    chrome.storage.local.set({ activeTheme: id }, () => {
      if (themeObj) {
        applyThemeStyles(themeObj);
      } else {
        applyThemeStyles(id);
      }
      // Re-render to update active outline
      chrome.storage.local.get(['unlockedThemes', 'activeTheme'], (data) => {
        renderThemeGallery(data.unlockedThemes || [], data.activeTheme || 'light');
      });
      showToast(`${title} applied!`);
    });
  });
  

  
  return swatch;
}

// Open/Close Modal Event Listeners
btnSettings.addEventListener("click", () => {
  settingsModal.classList.add("active");
  themeCodeInput.value = "";
});

btnCloseSettings.addEventListener("click", () => {
  settingsModal.classList.remove("active");
});

// Close modal if user clicks outside the modal content
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("active");
  }
});

// Apply / unlock theme code
btnApplyTheme.addEventListener("click", async () => {
  const rawCode = themeCodeInput.value.trim();
  if (!rawCode) {
    showToast("Please enter a theme code!");
    return;
  }
  
  // Disable button and show loading state
  const originalText = btnApplyTheme.textContent;
  btnApplyTheme.textContent = "Verifying...";
  btnApplyTheme.disabled = true;


  
  try {
    const { unlocked, owned_theme_names } = await new Promise(resolve => {
      chrome.storage.local.get(['unlockedThemes'], (data) => {
        const ul = data.unlockedThemes || [];
        resolve({
          unlocked: ul,
          owned_theme_names: ul.map(t => t.name)
        });
      });
    });

    const response = await fetch("http://localhost:3000/api/verify-theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: rawCode, owned_theme_names })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showToast(data.error || "Failed to verify code.");
      return;
    }
    if (!data.themes || !Array.isArray(data.themes) || data.themes.length === 0) {
      showToast("No themes found for this code.");
      return;
    }

    let lastUnlockedTheme = null;
    let addedCount = 0;

    data.themes.forEach(rawTheme => {
      // The database stores layout, colors, typography inside theme_data
      // To ensure backward compatibility, we merge everything or extract appropriately.
      const themeDataObj = rawTheme.theme_data || {};
      const colorsObj = themeDataObj.colors || themeDataObj; // Fallback if flat
      
      const theme = {
        id: rawTheme.id,
        name: rawTheme.name,
        colors: colorsObj, // Point to the actual colors object
        raw_data: themeDataObj, // Store the full data just in case
        price_tier: rawTheme.price_tier
      };

      // Check if already unlocked by ID or Name
      const existingIdx = unlocked.findIndex(t => t.id === theme.id || t.name === theme.name);
      if (existingIdx > -1) {
        unlocked[existingIdx] = theme;
      } else {
        unlocked.push(theme);
        addedCount++;
      }
      lastUnlockedTheme = theme;
    });

    if (lastUnlockedTheme) {
      chrome.storage.local.set({ unlockedThemes: unlocked, activeTheme: lastUnlockedTheme.id }, () => {
        applyThemeStyles(lastUnlockedTheme);
        renderThemeGallery(unlocked, lastUnlockedTheme.id);
        themeCodeInput.value = "";
        settingsModal.classList.remove("active");
        
        if (addedCount > 0) {
          const namesStr = data.themes.map(t => t.name).join(', ');
          showToast(`Theme "${namesStr}" applied successfully!`);
        } else {
          showToast(`Theme updated.`);
        }
      });
    }


  } catch (err) {
    console.error("Theme verification connection failed:", err);
    showToast("Failed to connect to verification server.");
  } finally {
    // Restore button state
    btnApplyTheme.textContent = originalText;
    btnApplyTheme.disabled = false;
  }
});

// Restore Default click listener
btnRestoreDefault.addEventListener("click", () => {
  chrome.storage.local.set({ activeTheme: 'light' }, () => {
    applyThemeStyles('light');
    chrome.storage.local.get(['unlockedThemes', 'activeTheme'], (data) => {
      renderThemeGallery(data.unlockedThemes || [], 'light');
    });
    settingsModal.classList.remove("active");
    showToast("Themes have been reset to default (Light).");
  });
});

// Initialize systems
initThemeSystem();
loadItems();
