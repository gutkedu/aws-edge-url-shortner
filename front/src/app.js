// API configuration
const API_URL = "https://ef9gjj3me8.execute-api.us-east-1.amazonaws.com/dev";

// DOM elements
const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");
const shortenBtn = document.getElementById("shorten-btn");
const resultContainer = document.getElementById("result-container");
const resultCard = document.getElementById("result-card");
const originalUrl = document.getElementById("original-url");
const shortUrlElement = document.getElementById("short-url");
const copyBtn = document.getElementById("copy-btn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");
const toastIcon = document.getElementById("toast-icon");
const toastProgress = document.getElementById("toast-progress");

// URL History elements
const urlHistoryContainer = document.getElementById("url-history-container");
const urlHistoryEmpty = document.getElementById("url-history-empty");
const urlHistoryList = document.getElementById("url-history-list");
const loadMoreBtn = document.getElementById("load-more-btn");
const loadMoreText = document.getElementById("load-more-text");

// Pagination state
let currentUrlKeys = []; // Store current displayed URLs
let nextToken = null; // Store the next token for pagination

// Event listeners
urlForm.addEventListener("submit", handleSubmit);
copyBtn.addEventListener("click", copyToClipboard);
loadMoreBtn.addEventListener("click", loadMoreUrls);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  feather.replace();
  fetchUrlHistory(true);
});

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();

  const url = urlInput.value.trim();

  if (!url) {
    showToast("Please enter a valid URL", "error");
    return;
  }

  // Validate URL format
  if (!isValidUrl(url)) {
    showToast("Please enter a valid URL (e.g., https://example.com)", "error");
    return;
  }

  // Show loading state
  shortenBtn.disabled = true;
  shortenBtn.innerHTML = "<span>Shortening...</span>";

  try {
    const shortUrl = await shortenUrl(url);
    displayResult(url, shortUrl);
    urlInput.value = "";

    // Show warning about CloudFront propagation
    showToast(
      "Link created! It may take up to 5 minutes to propagate globally.",
      "warning",
      6000
    );

    // Refresh the URL history to show the newly created URL
    fetchUrlHistory(true);
  } catch (error) {
    console.error("Error shortening URL:", error);
    showToast("Failed to shorten URL. Please try again.", "error");
  } finally {
    // Reset button
    shortenBtn.disabled = false;
    shortenBtn.innerHTML =
      '<span>Shorten</span><i data-feather="arrow-right"></i>';
    feather.replace();
  }
}

// Fetch URL history from the API
async function fetchUrlHistory(reset = false) {
  try {
    // Show loading state for loadMoreBtn if it's visible and we're not resetting
    if (!reset && loadMoreBtn.style.display !== "none") {
      loadMoreBtn.classList.add("loading");
      loadMoreBtn.disabled = true;
      loadMoreText.textContent = "Loading...";
    }

    // If reset is true, clear current data and start from beginning
    if (reset) {
      currentUrlKeys = [];
      nextToken = null;
    }

    // Build the URL with token if available
    let apiUrl = `${API_URL}/url-keys`;
    if (!reset && nextToken) {
      apiUrl += `?token=${encodeURIComponent(nextToken)}`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Get new URLs and the next token
    const newUrlKeys = data.urlKeys || [];
    nextToken = data.nextToken;

    if (reset) {
      // Replace all URLs if resetting
      currentUrlKeys = newUrlKeys;
      displayUrlHistory(currentUrlKeys, true);
    } else {
      // Append new URLs to existing ones
      currentUrlKeys = [...currentUrlKeys, ...newUrlKeys];
      displayUrlHistory(newUrlKeys, false);

      // Show "Loaded 10 more..." message if we loaded items
      if (newUrlKeys.length > 0) {
        showToast(`Loaded ${newUrlKeys.length} more links`, "success", 2000);
      }
    }

    // Update the load more button visibility based on nextToken
    updateLoadMoreButton();
  } catch (error) {
    console.error("Error fetching URL history:", error);
    showToast("Failed to load URL history", "error");
  } finally {
    // Reset loadMoreBtn state if it was in loading state
    if (loadMoreBtn.classList.contains("loading")) {
      loadMoreBtn.classList.remove("loading");
      loadMoreBtn.disabled = false;
      loadMoreText.textContent = "Load More";
    }
  }
}

// Load more URLs when the user clicks "Load More"
async function loadMoreUrls() {
  if (!nextToken) return;

  // Show loading state
  loadMoreBtn.classList.add("loading");
  loadMoreBtn.disabled = true;
  loadMoreText.textContent = "Loading...";

  try {
    await fetchUrlHistory(false);
  } finally {
    // Button state is reset in fetchUrlHistory
  }
}

// Update the load more button based on whether there's a next token
function updateLoadMoreButton() {
  if (nextToken) {
    loadMoreBtn.style.display = "flex";
    loadMoreBtn.disabled = false;
    loadMoreBtn.classList.remove("loading");
    loadMoreText.textContent = "Load More";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

// Display URL history items
function displayUrlHistory(urlItems, clearExisting) {
  // If clearing existing items
  if (clearExisting) {
    urlHistoryList.innerHTML = "";
  }

  if (!urlItems || urlItems.length === 0) {
    if (clearExisting) {
      urlHistoryEmpty.style.display = "block";
      urlHistoryList.style.display = "none";
    }
    return;
  }

  urlHistoryEmpty.style.display = "none";
  urlHistoryList.style.display = "grid";

  // Process and create DOM elements for each URL
  urlItems.forEach((urlItem, index) => {
    // Each urlItem is an object with a single key-value pair
    // The key is the shortId and the value is the original URL
    const shortId = Object.keys(urlItem)[0];
    const originalUrl = urlItem[shortId];

    const shortUrl = `https://${window.location.host}/${shortId}`;

    // Create HTML element for the URL item with animation delay
    const itemElement = document.createElement("div");
    itemElement.className = "url-history-item";
    itemElement.style.animationDelay = `${index * 0.05}s`;

    // Truncate original URL for display if too long
    const maxLength = 30; // Shorter display for original URL
    const displayOriginalUrl =
      originalUrl.length > maxLength
        ? originalUrl.substring(0, maxLength) + "..."
        : originalUrl;

    itemElement.innerHTML = `
      <div class="url-history-content">
        <a href="${shortUrl}" class="history-short-url" target="_blank">${shortId}</a>
        <div class="history-original-url" title="${originalUrl}">${displayOriginalUrl}</div>
      </div>
      <div class="url-actions">
        <button class="url-action-btn copy-history-btn" data-url="${shortUrl}" title="Copy to clipboard">
          <i data-feather="copy"></i>
        </button>
        <a href="${originalUrl}" class="url-action-btn" target="_blank" title="Visit original URL">
          <i data-feather="external-link"></i>
        </a>
      </div>
    `;

    urlHistoryList.appendChild(itemElement);
  });

  // Replace icons
  feather.replace();

  // Add event listeners to copy buttons
  document.querySelectorAll(".copy-history-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link copied to clipboard!"))
        .catch((err) => {
          console.error("Failed to copy: ", err);
          showToast("Failed to copy link", "error");
        });
    });
  });
}

// Validate URL format
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
}

// Shorten URL API call
async function shortenUrl(url) {
  const response = await fetch(`${API_URL}/shorten`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Display the shortened URL result
function displayResult(originalUrlText, data) {
  // Truncate original URL for display if too long
  const maxLength = 50;
  const displayUrl =
    originalUrlText.length > maxLength
      ? originalUrlText.substring(0, maxLength) + "..."
      : originalUrlText;

  originalUrl.textContent = displayUrl;
  shortUrlElement.textContent = data.shortUrl;
  shortUrlElement.href = data.shortUrl;

  // Show the result container with animation
  resultContainer.classList.add("visible");

  // Scroll to result if needed
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Copy shortened URL to clipboard
async function copyToClipboard() {
  try {
    const text = shortUrlElement.textContent;
    await navigator.clipboard.writeText(text);
    showToast("Link copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy: ", err);
    showToast("Failed to copy link", "error");
  }
}

// Show notification toast
function showToast(message, type = "success", duration = 3000) {
  // Set toast content
  toastMessage.textContent = message;

  // Set icon based on type
  if (type === "error") {
    toastIcon.setAttribute("data-feather", "alert-circle");
    toastIcon.classList.add("error");
    toastIcon.classList.remove("warning");
  } else if (type === "warning") {
    toastIcon.setAttribute("data-feather", "alert-triangle");
    toastIcon.classList.remove("error");
    toastIcon.classList.add("warning");
  } else {
    toastIcon.setAttribute("data-feather", "check-circle");
    toastIcon.classList.remove("error");
    toastIcon.classList.remove("warning");
  }

  // Replace the icon
  feather.replace();

  // Show the toast
  toast.classList.add("visible");

  // Reset the progress animation
  toastProgress.style.transition = "none";
  toastProgress.style.transform = "scaleX(0)";

  // Trigger reflow
  void toast.offsetWidth;

  // Start the progress animation
  toastProgress.style.transition = `transform ${duration / 1000}s linear`;
  toastProgress.style.transform = "scaleX(1)";

  // Hide toast after animation
  setTimeout(() => {
    toast.classList.remove("visible");
  }, duration);
}

// Initialize icons
document.addEventListener("DOMContentLoaded", () => {
  feather.replace();
});
