const apiKey = "e228c2555f5e4ab3576f55d4";

chrome.runtime.onMessage.addListener((msg, sender) => {
    const { from, subject } = msg;
    if (from === "content" && subject === "showBillingInfo") {
        chrome.pageAction.show(sender.tab.id);
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getApiKey") {
        sendResponse({ apiKey });
    }
});
