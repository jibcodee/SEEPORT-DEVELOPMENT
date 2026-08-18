/**
 * Seeport Chrome Extension API Shim
 * Emulates chrome.* extension APIs when running inside standard web browser iframes (for admin previews)
 */

if (typeof chrome === 'undefined') {
  window.chrome = {
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
  };
  
  console.log('[Seeport Shim] Chrome extension APIs successfully emulated in window context.');
}
