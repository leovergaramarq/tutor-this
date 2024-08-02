import {
    BILLING_URL,
    DEFAULT_CURRENCY,
    DEFAULT_LOW_SEASON,
    DEFAULT_USD_PER_HOUR,
    THEME_DARK,
    THEME_LIGHT
} from "./constants.js";
import { hasAncestor, numberWithCommas } from "./utils.js";

window.addEventListener("DOMContentLoaded", async () => {
    setupTheme();
    setupEvents();
    setupSavedData();

    const tab = await getCurrentTab();

    if (tab.url === BILLING_URL) {
        const result = await Promise.all([
            fetchBillingInfo(tab),
            fetchCurrencyRates()
        ]);

        billingInfo = result[0];
        currencyRates = result[1];

        setCustomValues();
        renderBillingInfo();
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
    document
        .querySelector(".custom-area")
        .addEventListener("change", handleCustomAreaChange);
}

function setupSavedData() {
    currency = localStorage.getItem("currency") || DEFAULT_CURRENCY;
    usdPerHour = +(localStorage.getItem("usdPerHour") || DEFAULT_USD_PER_HOUR);
    const lowSeasonString = localStorage.getItem("lowSeason");
    lowSeason =
        lowSeasonString !== null
            ? lowSeasonString === "true"
                ? true
                : false
            : DEFAULT_LOW_SEASON;
}

function handleToggleTheme() {
    theme = getOppositeTheme(theme);
    renderTheme();
    localStorage.setItem("theme", theme);
}

function handleCustomAreaChange(e) {
    if (e.target === $currency) {
        currency = Array.from($currency.children).find(
            ($option) => $option.selected
        ).value;
        localStorage.setItem("currency", currency);
    } else if (e.target === $usdPerHour) {
        usdPerHour = +$usdPerHour.value;
        localStorage.setItem("usdPerHour", usdPerHour);
    } else if (e.target === $lowSeason) {
        lowSeason = $lowSeason.checked;
        localStorage.setItem("lowSeason", lowSeason);
    }

    renderBillingInfo();
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

function handleResetData() {
    setCustomValues(false);
    renderBillingInfo();
}

function renderCurrencyOptions(currencyRates) {
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

function setCustomValues(renderCurrency = true) {
    const { minutesWaiting, minutesInSession, scheduledHours, onlineHours } =
        billingInfo[0];

    if (renderCurrency) renderCurrencyOptions(currencyRates);
    $scheduledHours.value = scheduledHours;
    $onlineHours.value = onlineHours;
    $minutesWaiting.value = minutesWaiting;
    $minutesInSession.value = minutesInSession;
    $usdPerHour.value = usdPerHour;
    $lowSeason.checked = lowSeason;
}

function renderBillingInfo() {
    const scheduledHours = +$scheduledHours.value;
    const onlineHours = +$onlineHours.value;
    const minutesWaiting = +$minutesWaiting.value;
    const minutesInSession = +$minutesInSession.value;
    const bonus = getBonus(minutesWaiting, minutesInSession);

    $paymentValue.textContent = numberWithCommas(
        (
            ((minutesWaiting * 2.5 + minutesInSession * usdPerHour) / 60 +
                bonus) *
            currencyRates[currency]
        ).toFixed(1)
    );
    $paymentUnits.textContent = currency;

    $onlineTimeValue.textContent = (
        (onlineHours / scheduledHours) *
        100
    ).toFixed(1);

    $timeWorkedValue.textContent = (
        (minutesInSession + minutesWaiting) /
        60
    ).toFixed(1);
}

function getBonus(minutesWaiting, minutesInSession) {
    const hours = (minutesInSession + minutesWaiting) / 60;

    if (lowSeason) {
        if (hours < 25) return 0;
        if (hours < 50) return 40;
        if (hours < 75) return 70;
        if (hours < 100) return 100;

        return 140;
    } else {
        if (hours < 30) return 0;
        if (hours < 60) return 40;
        if (hours < 90) return 70;
        if (hours < 120) return 100;

        return 140;
    }
}

let theme;
let currency;
let usdPerHour;
let lowSeason;
let billingInfo;
let currencyRates;

const $paymentValue = document.querySelector(".section-payment .payment-value");
const $paymentUnits = document.querySelector(".section-payment .payment-units");
const $onlineTimeValue = document.querySelector(
    ".section-online-time .online-time-value"
);
const $timeWorkedValue = document.querySelector(
    ".section-time-worked .time-worked-value"
);

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
const $lowSeason = document.querySelector(".custom-area .low-season input");

const $optionReset = document.querySelector(".options-area .option-reset");
const $optionTheme = document.querySelector(".options-area .option-theme");
