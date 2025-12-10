document.getElementById("filterBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: enableAutoFilter,
  });
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: disableAutoFilter,
  });
});

// --- The Logic that runs on the page ---

function enableAutoFilter() {
  // 1. Prevent running multiple observers
  if (window.okizemeObserver) {
    // If already running, just re-run the filter logic once and return
    window.runFilterLogic();
    return;
  }

  // 2. Define the main filtering function
  window.runFilterLogic = () => {
    const headers = document.querySelectorAll('div.px-4.py-3.flex.items-center.justify-between');
    let visibleCount = 0;
    let totalChecked = 0;

    headers.forEach(header => {
      const card = header.parentElement;
      if (!card) return;
      
      totalChecked++;

      // Find frame data
      const spans = card.querySelectorAll('span');
      let isLaunchPunishable = false;

      for (let span of spans) {
        const text = span.innerText.trim();
        if (/^-\d+$/.test(text)) {
          const val = parseInt(text, 10);
          if (val <= -15) {
            isLaunchPunishable = true;
            // Highlight
            span.style.border = "2px solid red";
            span.style.borderRadius = "4px";
            span.style.backgroundColor = "#fee2e2"; // light red bg
            span.style.color = "black";
            break; 
          }
        }
      }

      // Show/Hide
      if (isLaunchPunishable) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    // 3. Handle "Empty Page" feedback
    // Check if we already added a status message
    let statusMsg = document.getElementById('okizeme-status-msg');
    if (!statusMsg) {
        statusMsg = document.createElement('div');
        statusMsg.id = 'okizeme-status-msg';
        statusMsg.style.position = 'fixed';
        statusMsg.style.bottom = '20px';
        statusMsg.style.right = '20px';
        statusMsg.style.backgroundColor = '#333';
        statusMsg.style.color = '#fff';
        statusMsg.style.padding = '10px 20px';
        statusMsg.style.borderRadius = '8px';
        statusMsg.style.zIndex = '9999';
        statusMsg.style.fontWeight = 'bold';
        document.body.appendChild(statusMsg);
    }

    if (totalChecked > 0 && visibleCount === 0) {
        statusMsg.innerText = "Filter Active: No launch punishers on this page.";
        statusMsg.style.backgroundColor = '#ef4444'; // Red warning
    } else {
        statusMsg.innerText = `Filter Active: Found ${visibleCount} moves.`;
        statusMsg.style.backgroundColor = '#22c55e'; // Green success
    }
  };

  // 4. Create the Observer to watch for page changes (pagination)
  window.okizemeObserver = new MutationObserver((mutations) => {
    // We debounce so it doesn't run 100 times per second while loading
    if (window.okizemeTimer) clearTimeout(window.okizemeTimer);
    window.okizemeTimer = setTimeout(() => {
        window.runFilterLogic();
    }, 200); // Wait 200ms after changes stop to run
  });

  // Start watching the body for added nodes (pagination changes)
  window.okizemeObserver.observe(document.body, { childList: true, subtree: true });

  // Run immediately for the current page
  window.runFilterLogic();
  alert("Auto-Filter Enabled! You can now switch pages and the filter will persist.");
}

function disableAutoFilter() {
  // Stop the observer
  if (window.okizemeObserver) {
    window.okizemeObserver.disconnect();
    window.okizemeObserver = null;
  }
  
  // Remove status message
  const msg = document.getElementById('okizeme-status-msg');
  if (msg) msg.remove();

  // Show all moves again
  const headers = document.querySelectorAll('div.px-4.py-3.flex.items-center.justify-between');
  headers.forEach(header => {
    if(header.parentElement) header.parentElement.style.display = "";
  });
  
  alert("Filter Disabled.");
}