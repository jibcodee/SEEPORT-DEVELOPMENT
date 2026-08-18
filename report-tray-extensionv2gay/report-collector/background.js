importScripts('idb.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-selection",
    title: "Add selection to SEEPORT",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "add-image",
    title: "Add image to SEEPORT",
    contexts: ["image"]
  });
  chrome.contextMenus.create({
    id: "add-link",
    title: "Add link to SEEPORT",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "add-page",
    title: "Add this page to SEEPORT",
    contexts: ["page"]
  });

  // Clicking the toolbar icon opens the side panel directly.
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let item = null;

  if (info.menuItemId === "add-selection" && info.selectionText) {
    let htmlContent = "";
    if (tab && tab.url && !tab.url.startsWith("chrome://")) {
      try {
        const [{result}] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const sel = window.getSelection();
            if (!sel.rangeCount) return "";
            const div = document.createElement("div");
            div.appendChild(sel.getRangeAt(0).cloneContents());
            return div.innerHTML;
          }
        });
        if (result) htmlContent = result;
      } catch (err) {
        console.error("Failed to extract HTML:", err);
      }
    }
    item = { 
      type: "text", 
      content: info.selectionText.trim(),
      htmlContent: htmlContent
    };
  } else if (info.menuItemId === "add-image" && info.srcUrl) {
    try {
      const resp = await fetch(info.srcUrl);
      const blob = await resp.blob();
      const dataUrl = await blobToDataURL(blob);
      item = { type: "image", content: info.srcUrl, imageBlobUrl: dataUrl };
    } catch (e) {
      console.error("Failed to fetch image", e);
      item = { type: "image", content: info.srcUrl, imageBlobUrl: info.srcUrl };
    }
  } else if (info.menuItemId === "add-link" && info.linkUrl) {
    item = {
      type: "link",
      content: info.linkUrl,
      label: (info.selectionText && info.selectionText.trim()) || info.linkUrl
    };
  } else if (info.menuItemId === "add-page") {
    item = { type: "link", content: tab.url, label: tab.title || tab.url };
  }

  if (!item) return;

  item.id = crypto.randomUUID();
  item.sourceUrl = tab.url;
  item.sourceTitle = tab.title || "";
  item.timestamp = Date.now();

  await idb.put(item);
  await updateBadgeFromDB();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot') {
    captureScreenshot();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture-screenshot') {
    captureScreenshot().then(sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'update-badge') {
    updateBadgeFromDB();
  } else if (request.action === 'crop-coordinates') {
    processCrop(request.rect, request.dpr, sender.tab).then(sendResponse);
    return true;
  } else if (request.action === 'start-table-scraper') {
    startTableScraper().then(sendResponse);
    return true;
  } else if (request.action === 'table-scraped') {
    saveTableScraped(request.payload, sender.tab).then(sendResponse);
    return true;
  } else if (request.action === 'capture-whole-screen') {
    captureWholeScreen(request.tab || sender.tab).then(sendResponse);
    return true;
  } else if (request.action === 'save-cropped-image') {
    saveCroppedImage(request.dataUrl, sender.tab).then(sendResponse);
    return true;
  }
});

async function getActiveWebTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab || null;
}

async function captureScreenshot() {
  const tab = await getActiveWebTab();
  if (!tab) {
    console.error("No active web tab found for screenshot");
    return;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["cropper.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["cropper.js"]
    });
  } catch (err) {
    console.error("Failed to inject cropper:", err);
  }
}

async function processCrop(rect, dpr, senderTab) {
  try {
    // Use sender tab if available, otherwise find active tab
    let tab = senderTab;
    if (!tab || !tab.windowId) {
      tab = await getActiveWebTab();
    }
    if (!tab) {
      return { success: false, error: "No tab found" };
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    const canvas = new OffscreenCanvas(Math.round(rect.w), Math.round(rect.h));
    const ctx = canvas.getContext('2d');
    
    const sx = Math.round(rect.x * dpr);
    const sy = Math.round(rect.y * dpr);
    const sw = Math.round(rect.w * dpr);
    const sh = Math.round(rect.h * dpr);
    
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, Math.round(rect.w), Math.round(rect.h));
    
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
    const croppedDataUrl = await blobToDataURL(croppedBlob);
    
    const item = {
      id: crypto.randomUUID(),
      type: 'screenshot',
      imageBlobUrl: croppedDataUrl,
      sourceTitle: tab.title || "",
      sourceUrl: tab.url || "",
      timestamp: Date.now()
    };

    await idb.put(item);
    await updateBadgeFromDB();
    return { success: true };
  } catch (err) {
    console.error("processCrop failed:", err);
    return { success: false, error: err.message };
  }
}

async function startTableScraper() {
  const tab = await getActiveWebTab();
  if (!tab) {
    console.error("No active web tab found for table scraper");
    return;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["box-scraper.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["box-scraper.js"]
    });
  } catch (err) {
    console.error("Failed to inject table scraper:", err);
  }
}

async function saveTableScraped(payload, tab) {
  const item = {
    id: crypto.randomUUID(),
    type: 'table',
    content: `Table (Scraped): ${payload.rows} rows x ${payload.cols} columns\nReady to paste in Excel.`,
    htmlContent: payload.html,
    tsvData: payload.tsv,
    sourceTitle: tab.title || "",
    sourceUrl: tab.url || "",
    timestamp: Date.now(),
    color: "none"
  };

  await idb.put(item);
  await updateBadgeFromDB();
}

async function updateBadgeFromDB() {
  const items = await idb.getAll();
  const count = items.length;
  await chrome.storage.local.set({ itemsCount: count });
  updateBadge(count);
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#B8863A" });
}

// Keep the badge correct on browser restart.
chrome.storage.local.get("itemsCount", (data) => updateBadge(data.itemsCount || 0));

async function captureWholeScreen(tab) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    const item = {
      id: crypto.randomUUID(),
      type: 'screenshot',
      imageBlobUrl: dataUrl,
      sourceTitle: tab.title || "PDF Screenshot",
      sourceUrl: tab.url || "",
      timestamp: Date.now()
    };
    await idb.put(item);
    await updateBadgeFromDB();
    return { success: true };
  } catch (err) {
    console.error("captureWholeScreen failed:", err);
    return { success: false, error: err.message };
  }
}

async function saveCroppedImage(dataUrl, tab) {
  try {
    const item = {
      id: crypto.randomUUID(),
      type: 'screenshot',
      imageBlobUrl: dataUrl,
      sourceTitle: tab ? (tab.title || "") : "",
      sourceUrl: tab ? (tab.url || "") : "",
      timestamp: Date.now()
    };
    await idb.put(item);
    await updateBadgeFromDB();
    return { success: true };
  } catch (err) {
    console.error("saveCroppedImage failed:", err);
    return { success: false, error: err.message };
  }
}
