const apiKey = "e228c2555f5e4ab3576f55d4";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.from === "popup" && message.subject === "getApiKey") {
        sendResponse({ data: apiKey });
    }
    return true;
});
