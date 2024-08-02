import { BILLING_URL, THEME_DARK, THEME_LIGHT } from "./constants.js";
import { hasAncestor } from "./utils.js";

window.addEventListener("DOMContentLoaded", async () => {
    setupTheme();
    setupEvents();

    const tab = await getCurrentTab();

    if (!tab) {
        $fill.textContent = chrome.runtime?.lastError || "Couldn't get tab";
        console.log("Couldn't get tab");
        return;
    }

    if (tab.url === BILLING_URL) {
        console.log("Billing");

        const [billingInfo, currencyRates] = await Promise.all([
            fetchBillingInfo(tab),
            fetchCurrencyRates()
        ]);

        // data = {
        //     billingInfo,
        //     currencyRates
        // };
        // storeData(data);
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function fetchBillingInfo(tab) {
    return new Promise((res, rej) => {
        try {
            chrome.tabs.sendMessage(
                tab.id,
                { from: "popup", subject: "DOMInfo" },
                (rows) => res(rows)
            );
        } catch (err) {
            rej(err);
        }
    });
}

function fetchCurrencyRates() {
    return new Promise((res, rej) => {
        try {
            chrome.runtime.sendMessage(
                { type: "getApiKey" },
                async (response) => {
                    const { apiKey } = response;

                    const getData = (url) => {
                        return new Promise(async (res, rej) => {
                            try {
                                const response = await fetch(url);
                                const data = await response.json();

                                if (data.result === "success") {
                                    res(data.conversion_rates);
                                } else {
                                    rej(
                                        new Error(
                                            "Unable to fetch exchange rates"
                                        )
                                    );
                                }
                            } catch (err) {
                                rej(err);
                            }
                        });
                    };

                    let data;

                    try {
                        data = await getData("./currencyRates.mock.json");
                        // data = await getData(
                        //     `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
                        // );
                    } catch (err) {
                        data = await getData("./currencyRates.mock.json");
                    }

                    res(data);
                }
            );
        } catch (err) {
            rej(err);
        }
    });
}

function setupEvents() {
    document.addEventListener("click", (e) => {
        if (hasAncestor(e.target, $optionReset)) handleResetData();
        if (hasAncestor(e.target, $optionTheme)) handleToggleTheme();
    });
}

function setupTheme() {
    theme = localStorage.getItem("theme");

    if (!theme) {
        theme = THEME_LIGHT;
    }

    renderTheme();
    localStorage.setItem("theme", theme);
}

function handleToggleTheme() {
    theme = getOppositeTheme(theme);
    renderTheme();
    localStorage.setItem("theme", theme);
}

function renderTheme() {
    document.body.setAttribute("theme", theme);

    const $images = document.querySelectorAll(".options-area .option img");
    $images.forEach(($image) =>
        $image.setAttribute(
            "src",
            $image.getAttribute("src").replace(getOppositeTheme(theme), theme)
        )
    );
}

function getOppositeTheme(theme) {
    return theme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
}

function handleResetData() {}

function getStoredData() {
    const dataString = localStorage.getItem("data").trim();

    if (!dataString || ["null", "{}", "[]"].includes(data)) {
        return {};
    }

    return JSON.parse(dataString);
}

function storeData(data) {
    localStorage.setItem("data", JSON.stringify(data));
}

function getSelectedCurrency() {
    const $options = Array.from($currency.children);
    const $sel = $options.find(($op) => $op.getAttribute("selected"));

    return $sel.getAttribute("value");
}

let theme;
let data;

const $currency = document.querySelector(".custom-area .currency select");
const $scheduledHours = document.querySelector(
    ".custom-area .scheduled-hours input"
);
const $onlineHours = document.querySelector(".custom-area .online-hours input");
const $minutesWaiting = document.querySelector(
    ".custom-area .minutes-waiting input"
);
const $minutesInSession = document.querySelector(
    ".custom-area .minutes-in-session input"
);
const $usdPerHour = document.querySelector(".custom-area .usd-per-hour input");

const $optionReset = document.querySelector(".options-area .option-reset");
const $optionTheme = document.querySelector(".options-area .option-theme");
