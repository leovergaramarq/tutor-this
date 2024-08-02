const apiKey = "e228c2555f5e4ab3576f55d4";
let billingInfo = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // setTimeout(() => {}, 1);
    if (message.from === "content" && message.subject === "showBillingInfo") {
        console.log("before the shit");
        billingInfo = message.data;
        console.log(billingInfo);
        // chrome.pageAction.show(sender.tab.id);
        console.log("after the shit");
    } else if (message.from === "popup" && message.subject === "getApiKey") {
        sendResponse({ data: apiKey });
    } else if (
        message.from === "popup" &&
        message.subject === "getBillingInfo"
    ) {
        console.log(billingInfo);
        sendResponse({ data: billingInfo });
    }
    return true;
});
