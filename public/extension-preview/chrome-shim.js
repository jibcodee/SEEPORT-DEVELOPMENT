/**
 * Seeport Chrome Extension API Shim
 * Emulates chrome.* extension APIs when running inside standard web browser iframes (for admin previews)
 */

if (typeof chrome === 'undefined' || !chrome.storage) {
  window.chrome = window.chrome || {};
  Object.assign(window.chrome, {
    storage: {
      local: {
        get: (keys, callback) => {
          const result = {};
          if (Array.isArray(keys)) {
            keys.forEach(k => {
              const val = localStorage.getItem(k);
              try {
                result[k] = val ? JSON.parse(val) : undefined;
              } catch(e) {
                result[k] = val;
              }
            });
          } else if (typeof keys === 'string') {
            const val = localStorage.getItem(keys);
            try {
              result[keys] = val ? JSON.parse(val) : undefined;
            } catch(e) {
              result[keys] = val;
            }
          } else if (typeof keys === 'object' && keys !== null) {
            Object.keys(keys).forEach(k => {
              const val = localStorage.getItem(k);
              try {
                result[k] = val ? JSON.parse(val) : keys[k];
              } catch(e) {
                result[k] = val !== null ? val : keys[k];
              }
            });
          }
          if (callback) callback(result);
        },
        set: (items, callback) => {
          Object.keys(items).forEach(k => {
            const val = typeof items[k] === 'string' ? items[k] : JSON.stringify(items[k]);
            localStorage.setItem(k, val);
          });
          if (callback) callback();
        },
        remove: (keys, callback) => {
          if (Array.isArray(keys)) {
            keys.forEach(k => localStorage.removeItem(k));
          } else {
            localStorage.removeItem(keys);
          }
          if (callback) callback();
        }
      },
      onChanged: {
        addListener: (listener) => {
          window.addEventListener('storage', (e) => {
            const changes = {};
            if (e.key) {
              let parsedNew = e.newValue;
              try { parsedNew = JSON.parse(e.newValue); } catch(err) {}
              let parsedOld = e.oldValue;
              try { parsedOld = JSON.parse(e.oldValue); } catch(err) {}
              
              changes[e.key] = { 
                newValue: parsedNew,
                oldValue: parsedOld
              };
              listener(changes, 'local');
            }
          });
        },
        removeListener: () => {}
      }
    },
    runtime: {
      sendMessage: (message, callback) => {
        console.log('[Mock chrome.runtime.sendMessage]', message);
        if (callback) callback({ success: true });
      },
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    },
    tabs: {
      query: (queryInfo, callback) => {
        const dummyTab = [{ id: 1, windowId: 1, title: 'Seeport Shop Preview', url: window.location.href }];
        if (callback) callback(dummyTab);
        return Promise.resolve(dummyTab);
      },
      captureVisibleTab: (windowId, options) => {
        return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
      }
    },
    permissions: {
      request: (permissions, callback) => {
        if (callback) callback(true);
      }
    },
    scripting: {
      insertCSS: () => Promise.resolve(),
      executeScript: () => Promise.resolve()
    }
  });
  
  console.log('[Seeport Shim] Chrome extension APIs successfully emulated in window context.');

  // Seed Dummy Data for Live Preview
  setTimeout(async () => {
    try {
      if (typeof idb !== 'undefined') {
        const items = await idb.getAll();
        if (items.length === 0) {
          console.log('[Seeport Shim] Seeding dummy data...');
          await idb.put({
            id: 'dummy-1', type: 'text', content: 'This is a sample text capture from a website.', htmlContent: '<div>This is a sample text capture from a website.</div>', sourceTitle: 'Sample Website', sourceUrl: 'https://example.com', timestamp: Date.now() - 10000, color: 'none'
          });
          await idb.put({
            id: 'dummy-2', type: 'screenshot', imageBlobUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjNTU1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RHVtbXkgSW1hZ2U8L3RleHQ+PC9zdmc+', sourceTitle: 'Image Source', sourceUrl: 'https://example.com/image', timestamp: Date.now() - 8000
          });
          await idb.put({
            id: 'dummy-3', type: 'table', content: '', htmlContent: '<table><tr><th>Name</th><th>Role</th></tr><tr><td>Alice</td><td>Admin</td></tr><tr><td>Bob</td><td>User</td></tr></table>', sourceTitle: 'Data Table', sourceUrl: 'https://example.com/data', timestamp: Date.now() - 6000
          });
          await idb.put({
            id: 'dummy-4', type: 'link', content: 'https://github.com', sourceTitle: 'GitHub Repository', sourceUrl: 'https://github.com', timestamp: Date.now() - 4000
          });
          
          if (window.loadItems) {
            window.loadItems();
          } else {
            window.location.reload();
          }
        }
      }
    } catch(e) {
      console.error('Error seeding data:', e);
    }
  }, 1000);
}
