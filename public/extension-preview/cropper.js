(function() {
  if (document.getElementById('seeport-cropper')) return;

  const overlay = document.createElement('div');
  overlay.id = 'seeport-cropper';

  const hint = document.createElement('div');
  hint.className = 'seeport-crop-hint';
  hint.textContent = '✂️ Draw a box to capture screenshot (Click & Drag)';
  overlay.appendChild(hint);
  
  const selection = document.createElement('div');
  selection.className = 'seeport-selection';
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
    hint.textContent = '⏳ Memproses tangkapan skrin...';
    hint.style.background = '#856404';
    hint.style.borderColor = '#ffc107';
    hint.style.color = '#fff3cd';
    selection.style.display = 'none';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.cursor = 'wait';

    chrome.storage.local.get('tempScreenshot', (data) => {
      const dataUrl = data.tempScreenshot;
      if (!dataUrl) {
        hint.textContent = '❌ Gagal: Tangkapan asas tiada.';
        hint.style.background = '#721c24';
        hint.style.borderColor = '#f5c6cb';
        hint.style.color = '#f8d7da';
        setTimeout(cleanup, 1500);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const dpr = window.devicePixelRatio || 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(rect.width);
          canvas.height = Math.round(rect.height);
          const ctx = canvas.getContext('2d');

          // Draw the selected region from the screenshot
          ctx.drawImage(
            img, 
            Math.round(rect.left * dpr), 
            Math.round(rect.top * dpr), 
            Math.round(rect.width * dpr), 
            Math.round(rect.height * dpr), 
            0, 
            0, 
            Math.round(rect.width), 
            Math.round(rect.height)
          );

          const croppedDataUrl = canvas.toDataURL('image/png');

          // Send to background to save
          chrome.runtime.sendMessage({
            action: 'save-cropped-image',
            dataUrl: croppedDataUrl
          }, (response) => {
            overlay.style.display = '';
            overlay.style.background = 'transparent';
            overlay.style.cursor = 'default';
            
            const failed = chrome.runtime.lastError || (response && !response.success);
            if (failed) {
              const errMsg = chrome.runtime.lastError?.message || response?.error || 'Unknown error';
              hint.textContent = '❌ Gagal: ' + errMsg;
              hint.style.background = '#721c24';
              hint.style.borderColor = '#f5c6cb';
              hint.style.color = '#f8d7da';
            } else {
              hint.textContent = '✅ Tangkapan skrin berjaya!';
              hint.style.background = '#155724';
              hint.style.borderColor = '#28a745';
              hint.style.color = '#d4edda';
            }
            setTimeout(cleanup, 1200);
          });
        } catch (err) {
          hint.textContent = '❌ Ralat: ' + err.message;
          hint.style.background = '#721c24';
          hint.style.borderColor = '#f5c6cb';
          hint.style.color = '#f8d7da';
          setTimeout(cleanup, 1500);
        }
      };
      img.onerror = () => {
        hint.textContent = '❌ Gagal memuatkan tangkapan.';
        hint.style.background = '#721c24';
        hint.style.borderColor = '#f5c6cb';
        hint.style.color = '#f8d7da';
        setTimeout(cleanup, 1500);
      };
      img.src = dataUrl;
    });
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
