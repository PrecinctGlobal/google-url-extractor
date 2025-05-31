document.addEventListener('DOMContentLoaded', () => {
  const urlsTextarea = document.getElementById('urlsTextarea');
  const copyButton = document.getElementById('copyButton');
  const downloadButton = document.getElementById('downloadButton');
  const statusElement = document.getElementById('status');

  // Load URLs from storage
  chrome.storage.local.get('gseExtractedUrls', (data) => {
    if (data.gseExtractedUrls && data.gseExtractedUrls.length > 0) {
      urlsTextarea.value = data.gseExtractedUrls.join('\n');
      statusElement.textContent = `${data.gseExtractedUrls.length} URLs loaded.`;
    } else {
      urlsTextarea.value = "No URLs extracted from the current Google search page, or the page hasn't finished processing.";
      statusElement.textContent = "Ensure you are on a Google search results page.";
    }
  });

  copyButton.addEventListener('click', () => {
    if (urlsTextarea.value.length === 0 || urlsTextarea.value.startsWith("No URLs extracted")) {
      statusElement.textContent = 'Nothing to copy.';
      statusElement.style.color = 'red';
      return;
    }
    urlsTextarea.select();
    try {
      document.execCommand('copy'); // Deprecated, but navigator.clipboard requires HTTPS context for extension popups or specific permissions.
      statusElement.textContent = 'URLs copied to clipboard!';
      statusElement.style.color = 'green';
    } catch (err) {
      // Fallback for browsers/contexts where execCommand fails or is unsupported for popups
      navigator.clipboard.writeText(urlsTextarea.value).then(() => {
         statusElement.textContent = 'URLs copied to clipboard! (using clipboard API)';
         statusElement.style.color = 'green';
      }).catch(e => {
         statusElement.textContent = 'Failed to copy URLs.';
         statusElement.style.color = 'red';
         console.error('Copy failed: ', e);
      });
    }
  });

  downloadButton.addEventListener('click', () => {
     if (urlsTextarea.value.length === 0 || urlsTextarea.value.startsWith("No URLs extracted")) {
      statusElement.textContent = 'Nothing to download.';
      statusElement.style.color = 'red';
      return;
    }
    const textToSave = urlsTextarea.value;
    const blob = new Blob([textToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google_search_urls.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    statusElement.textContent = 'URLs download initiated.';
    statusElement.style.color = 'green';
  });
});
