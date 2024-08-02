chrome.runtime.sendMessage({
    from: "content",
    subject: "showBillingInfo",
    data: getBillingInfo()
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.from === "popup" && message.subject === "getBillingInfo") {
        sendResponse({ data: getBillingInfo() });
    }
});

function getBillingInfo() {
    const $rows = Array.from(
        document.querySelectorAll('table tbody tr[valign="top"]')
    );
    return $rows.map(($row) => ({
        scheduledHours: +$row.children[2].textContent,
        onlineHours: +$row.children[3].textContent,
        minutesWaiting: +$row.children[8].textContent.replace(/,/g, ""),
        minutesInSession: +$row.children[9].textContent.replace(/,/g, "")
    }));
}
