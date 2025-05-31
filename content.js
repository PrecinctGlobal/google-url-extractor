console.log("Google Search Enhancer: content.js loaded");

function isGoogleSearchPage() {
  return window.location.href.includes("google.com/search");
}

function ensureThousandResults() {
  if (isGoogleSearchPage()) {
    const currentUrl = new URL(window.location.href);
    const queryParams = currentUrl.searchParams;

    if (queryParams.get("num") !== "1000") {
      console.log("Google Search Enhancer: 'num' parameter is not 1000. Modifying URL.");
      queryParams.set("num", "1000");
      currentUrl.search = queryParams.toString();
      // Prevent infinite redirect loops for cases where num=1000 is not respected or overridden
      // by adding a temporary marker. This marker is not standard and is for our internal check.
      if (!sessionStorage.getItem('gse_redirected')) {
        sessionStorage.setItem('gse_redirected', 'true');
        window.location.href = currentUrl.toString();
      } else {
        console.log("Google Search Enhancer: Already attempted redirect for num=1000 in this session.");
      }
    } else {
      console.log("Google Search Enhancer: 'num=1000' already in URL.");
      // Clear the marker if we successfully landed on a page with num=1000
      sessionStorage.removeItem('gse_redirected');
    }
  }
}

// Run the function to ensure 1000 results
ensureThousandResults();

// Further logic for URL extraction will be added later.
function extractSearchLinks() {
  if (!isGoogleSearchPage()) {
    return;
  }

  console.log("Google Search Enhancer: Attempting to extract search links.");
  const extractedUrls = [];

  // Google's selectors can change. This is a common pattern.
  // Search result links are often anchor tags whose parent contains an h3,
  // or anchor tags that are children of an h3.
  // We are looking for links that are direct search results.
  // These typically have a structure like <div class="g"><div class="tF2Cxc">...<a href="..."><h3>...</h3></a>...</div></div>
  // Or sometimes the <h3> is inside the <a>.
  // A more robust selector might target `div.g a:first-of-type` or similar if class names are stable.
  // For now, let's try to find anchors that have an H3 tag as a child or are children of an H3,
  // and whose href seems like a direct link.

  // Selector for links that are direct children of elements with class 'yuRUbf' (a common container for result links)
  const linkElements = document.querySelectorAll('div.yuRUbf > a');

  linkElements.forEach(link => {
    const href = link.href;
    // Basic filter to avoid internal Google links like "Related searches" or cached pages if possible.
    // This is a simple check; more robust filtering might be needed.
    if (href && !href.startsWith(window.location.origin) && !href.includes("google.com")) {
      if (!extractedUrls.includes(href)) {
        extractedUrls.push(href);
      }
    }
  });

  if (extractedUrls.length > 0) {
    console.log(`Google Search Enhancer: Extracted ${extractedUrls.length} URLs:`);
    // extractedUrls.forEach(url => console.log(url)); // Optional: keep for debugging
    chrome.storage.local.set({ gseExtractedUrls: extractedUrls }, () => {
      console.log("Google Search Enhancer: URLs saved to local storage.");
    });
  } else {
    console.log("Google Search Enhancer: No URLs extracted. The selectors might need an update or the page structure is different.");
    // Clear storage if no URLs are found on a page to avoid showing stale data
    chrome.storage.local.remove('gseExtractedUrls');
  }
  // Remove: window.gseExtractedUrls = extractedUrls;
}

// Run extraction after a delay, to allow the page (and potentially our redirect) to settle.
// The DOMContentLoaded event might be too early if we just redirected.
// A MutationObserver would be more robust for dynamic content loading.
// For now, a simple timeout after our redirect logic.

if (document.readyState === 'loading') {
  // Still loading, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // If we redirected, the content below might run on the *old* page before redirect happens.
    // So, ensureThousandResults should handle the redirect, and then on the *new* page load, this will run.
    // If num=1000 was already there, or after redirect, extract links.
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("num") === "1000" && !sessionStorage.getItem('gse_redirected')) {
      extractSearchLinks();
    } else if (!sessionStorage.getItem('gse_redirected')) {
      // This case is if num=1000 is not set and we didn't redirect (e.g. first load, no num param)
      // Or if we are on a page that is not a search page.
      // extractSearchLinks has its own check for isGoogleSearchPage.
      extractSearchLinks();
    }
    // Clear the redirect flag after attempting extraction on the new page.
    // This ensures that if the user navigates back and forth, the logic can re-run.
    // However, ensureThousandResults also clears it on successful load of num=1000.
    // sessionStorage.removeItem('gse_redirected'); // This might be too aggressive here. Let ensureThousandResults manage it.
  });
} else {
  // DOMContentLoaded has already fired.
  // Same logic as above.
  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.get("num") === "1000" && !sessionStorage.getItem('gse_redirected')) {
    extractSearchLinks();
  } else if (!sessionStorage.getItem('gse_redirected')) {
    extractSearchLinks();
  }
  // sessionStorage.removeItem('gse_redirected'); // Same as above.
}

// Clear the redirect flag if we are on the target page and it wasn't set by our script in this instance
// This helps if the user manually navigates to a num=1000 page.
window.addEventListener('load', () => {
  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.get("num") === "1000") {
    sessionStorage.removeItem('gse_redirected');
  }
});
```
