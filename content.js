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
        month: new Date($row.children[0].textContent.split(" ")[0])
            .toLocaleDateString("en-US", { year: "numeric", month: "long" })
            .replace(/\s/, ", "),
        scheduledHours: +$row.children[2].textContent,
        onlineHours: +$row.children[3].textContent,
        minutesWaiting: +$row.children[8].textContent.replace(/,/g, ""),
        minutesInSession: +$row.children[9].textContent.replace(/,/g, "")
    }));
}
