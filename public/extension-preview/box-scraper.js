(function() {
  if (document.getElementById('seeport-box-scraper')) return;

  const overlay = document.createElement('div');
  overlay.id = 'seeport-box-scraper';

  const hint = document.createElement('div');
  hint.className = 'seeport-scrape-hint';
  hint.textContent = '📊 Draw a box over a table to scrape data (Click & Drag)';
  overlay.appendChild(hint);

  const selection = document.createElement('div');
  selection.className = 'seeport-box-selection';
  overlay.appendChild(selection);

  document.body.appendChild(overlay);

  let startX, startY, isDragging = false;

  function onMouseDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0px';
    selection.style.height = '0px';
    selection.style.display = 'block';
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selection.style.left = left + 'px';
    selection.style.top = top + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;

    const rect = selection.getBoundingClientRect();

    if (rect.width < 10 || rect.height < 10) {
      cleanup();
      return;
    }

    // Show processing state
    hint.textContent = '⏳ Mengikis data jadual...';
    hint.style.background = '#856404';
    hint.style.borderColor = '#ffc107';
    hint.style.color = '#fff3cd';
    selection.style.border = '2px solid #ffc107';
    overlay.style.cursor = 'wait';

    // Hide overlay temporarily to access elements underneath
    overlay.style.display = 'none';

    // Find the best table under the drawn box
    const tables = document.querySelectorAll('table');
    let targetTable = null;
    let maxArea = 0;

    for (const table of tables) {
      const trect = table.getBoundingClientRect();
      const overlapX = Math.max(0, Math.min(rect.right, trect.right) - Math.max(rect.left, trect.left));
      const overlapY = Math.max(0, Math.min(rect.bottom, trect.bottom) - Math.max(rect.top, trect.top));
      const area = overlapX * overlapY;
      if (area > maxArea) {
        maxArea = area;
        targetTable = table;
      }
    }

    // Restore overlay for feedback
    overlay.style.display = '';

    if (targetTable) {
      const data = extractTableData(targetTable);
      chrome.runtime.sendMessage({
        action: 'table-scraped',
        payload: data
      }, () => {
        hint.textContent = '✅ Berjaya dikikis (Done!)';
        hint.style.background = '#155724';
        hint.style.borderColor = '#28a745';
        hint.style.color = '#d4edda';
        selection.style.display = 'none';
        overlay.style.background = 'transparent';
        overlay.style.cursor = 'default';
        setTimeout(cleanup, 1200);
      });
    } else {
      hint.textContent = '❌ Tiada jadual ditemui dalam kotak!';
      hint.style.background = '#721c24';
      hint.style.borderColor = '#f5c6cb';
      hint.style.color = '#f8d7da';
      selection.style.border = '2px solid #dc3545';
      overlay.style.cursor = 'default';
      setTimeout(cleanup, 1500);
    }
  }

  function extractTableData(table) {
    let tsv = "";
    let htmlLines = [];
    const rows = table.querySelectorAll('tr');

    htmlLines.push('<table border="1" style="border-collapse: collapse; font-family: Arial; font-size: 12pt;">');

    for (const row of rows) {
      const rowData = [];
      const cells = row.querySelectorAll('th, td');

      htmlLines.push('<tr>');
      for (const cell of cells) {
        let text = cell.innerText.replace(/\t|\n|\r/g, ' ').trim();
        rowData.push(text);

        const tag = cell.tagName.toLowerCase() === 'th' ? 'th' : 'td';
        htmlLines.push(`<${tag} style="padding: 4px 8px; border: 1px solid #999;">${text}</${tag}>`);
      }
      htmlLines.push('</tr>');
      tsv += rowData.join('\t') + '\n';
    }
    htmlLines.push('</table>');

    return {
      tsv: tsv,
      html: htmlLines.join(''),
      rows: rows.length,
      cols: rows.length > 0 ? rows[0].querySelectorAll('th, td').length : 0
    };
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') cleanup();
  }

  function cleanup() {
    if (overlay.parentNode) overlay.remove();
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
  }

  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);
})();
