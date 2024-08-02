import {
    BILLING_URL,
    DEFAULT_CURRENCY,
    DEFAULT_USD_PER_HOUR,
    THEME_DARK,
    THEME_LIGHT
} from "./constants.js";
import { hasAncestor } from "./utils.js";

window.addEventListener("DOMContentLoaded", async () => {
    setupTheme();
    setupEvents();
    setupSavedData();

    const tab = await getCurrentTab();

    if (tab.url === BILLING_URL) {
        const [billingInfo, currencyRates] = await Promise.all([
            fetchBillingInfo(tab),
            fetchCurrencyRates()
        ]);
        // document.querySelector(".payment-value").textContent =
        //     JSON.stringify(billingInfo[0]);
        const {
            minutesWaiting,
            minutesInSession,
            scheduledHours,
            onlineHours
        } = billingInfo[0];

        // $currency.setAttribute = DEFAULT_CURRENCY;
        setCurrencyOptions(currencyRates);
        $scheduledHours.setAttribute("value", scheduledHours);
        $onlineHours.setAttribute("value", onlineHours);
        $minutesWaiting.setAttribute("value", minutesWaiting);
        $minutesInSession.setAttribute("value", minutesInSession);
        $usdPerHour.setAttribute("value", DEFAULT_USD_PER_HOUR);
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
            // setTimeout(() => {
            //     // console.log("xd");
            // }, 1000);
            // chrome.runtime.sendMessage(
            //     { from: "popup", subject: "getBillingInfo" },
            //     ({ data }) => res(data)
            // );

            chrome.tabs.sendMessage(
                tab.id,
                { from: "popup", subject: "getBillingInfo" },
                ({ data }) => res(data)
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
                { from: "popup", subject: "getApiKey" },
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

function setupTheme() {
    theme = localStorage.getItem("theme");

    if (!theme) {
        theme = THEME_LIGHT;
    }

    renderTheme();
    localStorage.setItem("theme", theme);
}

function setupEvents() {
    document.addEventListener("click", (e) => {
        if (hasAncestor(e.target, $optionReset)) handleResetData();
        else if (hasAncestor(e.target, $optionTheme)) handleToggleTheme();
    });
}

function setupSavedData() {
    currency = localStorage.getItem("currency") || DEFAULT_CURRENCY;
    usdPerHour = localStorage.getItem("usdPerHour") || DEFAULT_USD_PER_HOUR;
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

function storeData(data) {
    localStorage.setItem("data", JSON.stringify(data));
}

function getSelectedCurrency() {
    const $options = Array.from($currency.children);
    const $sel = $options.find(($op) => $op.getAttribute("selected"));

    return $sel.getAttribute("value");
}

function setCurrencyOptions(currencyRates) {
    $currency.innerHTML = "";
    const $fragment = document.createDocumentFragment();

    Object.keys(currencyRates).forEach((curr) => {
        const $option = document.createElement("option");
        $option.value = curr;
        $option.text = `${curr} - ${currencyRates[curr].toFixed(1)}`;
        if (curr === currency) $option.selected = true;
        $fragment.appendChild($option);
    });

    $currency.appendChild($fragment);
}

let theme;
let currency;
let usdPerHour;

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
