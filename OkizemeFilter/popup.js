document.getElementById("filterBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: filterMovesScript,
  });
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: resetMovesScript,
  });
});

// The function that runs inside the page to FILTER
function filterMovesScript() {
  // Use the Header selector you provided to find card containers
  // We assume the header is a direct child of the card wrapper
  const headers = document.querySelectorAll('div.px-4.py-3.flex.items-center.justify-between');
  let count = 0;

  headers.forEach(header => {
    const card = header.parentElement;
    if (!card) return;

    // Find all spans (looking for frame data)
    const spans = card.querySelectorAll('span');
    let isLaunchPunishable = false;

    for (let span of spans) {
      const text = span.innerText.trim();
      
      // Look for strict negative numbers (e.g. -15)
      if (/^-\d+$/.test(text)) {
        const val = parseInt(text, 10);
        
        // CONDITION: -15 or lower (e.g. -16, -23)
        if (val <= -15) {
          isLaunchPunishable = true;
          // Highlight it so you know why it's shown
          span.style.border = "2px solid red";
          span.style.borderRadius = "4px";
          break; 
        }
      }
    }

    // Toggle visibility
    if (isLaunchPunishable) {
      card.style.display = "";
      count++;
    } else {
      card.style.display = "none";
    }
  });

  alert(`Filter applied! Found ${count} launch punishable moves.`);
}

// The function that runs inside the page to RESET
function resetMovesScript() {
  const headers = document.querySelectorAll('div.px-4.py-3.flex.items-center.justify-between');
  headers.forEach(header => {
    if(header.parentElement) {
        header.parentElement.style.display = "";
    }
  });
}