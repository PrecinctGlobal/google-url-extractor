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
      if (!sessionStorage.getItem('gse_redirected')) {
        sessionStorage.setItem('gse_redirected', 'true');
        window.location.href = currentUrl.toString();
      } else {
        console.log("Google Search Enhancer: Already attempted redirect for num=1000 in this session.");
      }
    } else {
      console.log("Google Search Enhancer: 'num=1000' already in URL.");
      sessionStorage.removeItem('gse_redirected');
    }
  }
}

ensureThousandResults();

function extractSearchLinks() {
  if (!isGoogleSearchPage()) {
    return;
  }

  console.log("Google Search Enhancer: Attempting to extract search links with new logic.");
  const extractedUrls = [];
  const potentialLinkElements = document.querySelectorAll('a[data-ved]');
  console.log(`Found ${potentialLinkElements.length} potential links with [data-ved]. Filtering...`);

  potentialLinkElements.forEach(link => {
    const href = link.href;
    const h3 = link.querySelector('h3');

    let isPAA = false;
    // Updated PAA check:
    // If the link or its close ancestor has role=button or specific jscontroller/jsname attributes used by PAA boxes.
    if (link.closest('div[jscontroller="HyNnOd"], div[jsname="Cpkphb"], [role="button"]')) {
        isPAA = true;
    }
    // Also, if the link itself has role=button this might be a PAA trigger.
    if (link.getAttribute('role') === 'button') {
        isPAA = true;
    }

    if (h3 && href && href.startsWith('http') && !href.includes('google.com') && !href.startsWith(window.location.origin) && !isPAA) {
      const h3Text = h3.textContent || h3.innerText;
      if (h3Text && h3Text.trim() !== "") {
        if (!extractedUrls.includes(href)) {
          extractedUrls.push(href);
        }
      }
    }
  });

  if (extractedUrls.length > 0) {
    console.log(`Google Search Enhancer: Extracted ${extractedUrls.length} URLs:`);
    chrome.storage.local.set({ gseExtractedUrls: extractedUrls }, () => {
      console.log("Google Search Enhancer: URLs saved to local storage.");
    });
  } else {
    console.log("Google Search Enhancer: No URLs extracted. Selectors/filters might need further adjustment.");
    chrome.storage.local.remove('gseExtractedUrls');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("num") === "1000" && !sessionStorage.getItem('gse_redirected')) {
      extractSearchLinks();
    } else if (!sessionStorage.getItem('gse_redirected')) {
      extractSearchLinks();
    }
  });
} else {
  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.get("num") === "1000" && !sessionStorage.getItem('gse_redirected')) {
    extractSearchLinks();
  } else if (!sessionStorage.getItem('gse_redirected')) {
    extractSearchLinks();
  }
}

window.addEventListener('load', () => {
  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.get("num") === "1000") {
    sessionStorage.removeItem('gse_redirected');
  }
});
// Adding a final newline for good measure.
