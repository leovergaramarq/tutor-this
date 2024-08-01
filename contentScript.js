chrome.runtime.sendMessage({
    from: "content",
    subject: "showBillingInfo"
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
    const { from, subject } = msg;

    if (from === "popup" && subject === "DOMInfo") {
        const $rows = Array.from(
            document.querySelectorAll('table tbody tr[valign="top"]')
        );
        const rows = $rows.map(($row) => ({
            scheduledHours: +$row.children[2].textContent,
            onlineHours: +$row.children[3].textContent,
            minutesWaiting: +$row.children[8].textContent.replace(/,/g, ""),
            minutesInSession: +$row.children[9].textContent.replace(/,/g, "")
        }));

        response(rows);
    }
});
