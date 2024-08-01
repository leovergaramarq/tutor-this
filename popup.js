import { BILLING_URL } from "./constants.js";
window.addEventListener("DOMContentLoaded", async () => {
    const $fill = document.querySelector(".fill");
    $fill.textContent = "Tutor This";

    const tab = await getCurrentTab();

    if (!tab) {
        $fill.textContent = chrome.runtime?.lastError || "Couldn't get tab";
        console.log("Couldn't get tab");
        return;
    }

    if (tab.url === BILLING_URL) {
        console.log("Billing");
        $fill.textContent = "Billing";
        chrome.tabs.sendMessage(
            tab.id,
            { from: "popup", subject: "DOMInfo" },
            (rows) => {
                console.log(rows);
            }
        );
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
