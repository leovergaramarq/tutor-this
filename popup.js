import {
    API_KEY_COOLDOWN_DAYS,
    BILLING_URL,
    DEFAULT_CURRENCY,
    DEFAULT_LOW_SEASON,
    DEFAULT_USD_PER_HOUR,
    THEME_DARK,
    THEME_LIGHT
} from "./constants.js";
import {
    containerHtml,
    errorHtml,
    optionResetHtml,
    optionsAreaHtml,
    pageHtml,
    wrongSiteHtml
} from "./htmlComponents.js";
import { hasAncestor, numberWithCommas } from "./utils.js";

window.addEventListener("DOMContentLoaded", async () => {
    setupOptionsArea();
    setupTheme();

    let tab;
    try {
        tab = await getCurrentTab();
    } catch (err) {
        setupErrorHtml(errorHtml);
        return;
    }

    if (tab.url === BILLING_URL) {
        let result;

        try {
            result = await Promise.all([
                fetchBillingInfo(tab),
                fetchCurrencyRates()
            ]);
        } catch (err) {
            setupErrorHtml(errorHtml);
            return;
        }

        billingInfo = result[0];
        currencyRates = result[1];

        setupSavedData();
        setupBillingHtml();
        setupReferences();

        setCustomValues();
        renderMonthPage();
        renderBillingInfo();
    } else {
        setupErrorHtml(wrongSiteHtml);
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
                    const { data: apiKey } = response;

                    const getData = (url) => {
                        return new Promise(async (res, rej) => {
                            try {
                                const response = await fetch(url);
                                const data = await response.json();

                                if (data.result === "success") {
                                    res(data);
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

                    const canUseApiKey = (lastUsedDate) => {
                        const currentDate = new Date();
                        const lastUsed = new Date(lastUsedDate);
                        currentDate.setHours(0, 0, 0, 0);
                        lastUsed.setHours(0, 0, 0, 0);
                        const diffDays =
                            (currentDate - lastUsed) / (1000 * 60 * 60 * 24);
                        return diffDays >= API_KEY_COOLDOWN_DAYS;
                    };

                    const lastCurrencyApiReq =
                        localStorage.getItem("lastCurrencyApiReq");
                    let data;

                    if (
                        !lastCurrencyApiReq ||
                        canUseApiKey(+lastCurrencyApiReq)
                    ) {
                        console.log("Can use API");
                        try {
                            data = await getData(
                                `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
                            );

                            localStorage.setItem(
                                "lastCurrencyApiReq",
                                new Date().getTime()
                            );
                            localStorage.setItem(
                                "currencyRates",
                                JSON.stringify(data)
                            );
                        } catch (err) {
                            data = JSON.parse(
                                localStorage.getItem("currencyRates")
                            );

                            if (!data?.conversion_rates) {
                                data = await getData(
                                    "./currencyRates.mock.json"
                                );
                                localStorage.setItem(
                                    "currencyRates",
                                    JSON.stringify(data)
                                );
                            }
                        }
                    } else {
                        data = JSON.parse(
                            localStorage.getItem("currencyRates")
                        );

                        if (!data?.conversion_rates) {
                            data = await getData("./currencyRates.mock.json");
                            localStorage.setItem(
                                "currencyRates",
                                JSON.stringify(data)
                            );
                        }
                    }

                    res(data.conversion_rates);
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

function setupOptionsArea() {
    document.body.insertAdjacentHTML("afterbegin", optionsAreaHtml);
    $optionTheme = document.querySelector(".options-area .option-theme");

    document.addEventListener("click", (e) => {
        if (hasAncestor(e.target, $optionReset)) handleResetData();
        else if (hasAncestor(e.target, $optionTheme)) handleToggleTheme();
    });
}

function setupBillingHtml() {
    document.body.insertAdjacentHTML("afterbegin", containerHtml);
    document
        .querySelector(".options-area")
        .insertAdjacentHTML("afterbegin", optionResetHtml);
    document
        .querySelector(".custom-area")
        .addEventListener("change", handleCustomAreaChange);

    const $pages = document.querySelector(".pages");
    $pages.addEventListener("click", handlePagesClick);

    $pagesList = $pages.querySelector("ul");
    billingInfo.forEach(() =>
        $pagesList.insertAdjacentHTML("beforeend", pageHtml)
    );

    page = 0;
    sliding = false;
}

function setupReferences() {
    $month = document.querySelector(".month");
    // $pagesList = $pages.querySelector(".pages ul");
    $pageArrows = document.querySelectorAll(".pages-arrow");
    $paymentValue = document.querySelectorAll(
        ".section-payment .payment-value"
    );
    $paymentUnits = document.querySelectorAll(
        ".section-payment .payment-units"
    );
    $onlineTimeValue = document.querySelectorAll(
        ".section-online-time .online-time-value"
    );
    $timeWorkedValue = document.querySelectorAll(
        ".section-time-worked .time-worked-value"
    );

    $currency = document.querySelector(".custom-area .currency select");
    $scheduledHours = document.querySelector(
        ".custom-area .scheduled-hours input"
    );
    $onlineHours = document.querySelector(".custom-area .online-hours input");
    $minutesWaiting = document.querySelector(
        ".custom-area .minutes-waiting input"
    );
    $minutesInSession = document.querySelector(
        ".custom-area .minutes-in-session input"
    );
    $usdPerHour = document.querySelector(".custom-area .usd-per-hour input");
    $lowSeason = document.querySelector(".custom-area .low-season input");

    $optionReset = document.querySelector(".options-area .option-reset");
    // $optionTheme = document.querySelector(".options-area .option-theme");
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

function handlePagesClick(e) {
    const render = () => {
        setCustomValues({ renderCurrency: false });
        renderMonthPage();
        renderBillingInfo();
    };

    if (hasAncestor(e.target, $pageArrows[0]) && page > 0 && movePage(-1)) {
        page--;
        render();
    } else if (
        hasAncestor(e.target, $pageArrows[1]) &&
        page < billingInfo.length - 1 &&
        movePage(1)
    ) {
        page++;
        render();
    }
}

function movePage(dir) {
    if (sliding) {
        return;
    }

    sliding = true;
    const transitionDuration = 500;

    if (dir < 0) {
        const $last = $pagesList.lastElementChild;
        $pagesList.insertAdjacentElement("afterbegin", $last);
        $last.style.animation = `slide-right ${transitionDuration}ms`;

        setTimeout(() => {
            $last.style.animation = "none";
            sliding = false;
        }, transitionDuration);
    } else {
        const $first = $pagesList.firstElementChild;
        $first.style.animation = `slide-left ${transitionDuration}ms`;

        setTimeout(() => {
            $pagesList.insertAdjacentElement("beforeend", $first);
            $first.style.animation = "none";
            sliding = false;
        }, transitionDuration);
    }

    return true;
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
    setCustomValues({ renderCurrency: false });
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

function setCustomValues({ renderCurrency } = { renderCurrency: true }) {
    const { minutesWaiting, minutesInSession, scheduledHours, onlineHours } =
        billingInfo[page];

    if (renderCurrency) renderCurrencyOptions(currencyRates);
    $scheduledHours.value = scheduledHours;
    $onlineHours.value = onlineHours;
    $minutesWaiting.value = minutesWaiting;
    $minutesInSession.value = minutesInSession;
    $usdPerHour.value = usdPerHour;
    $lowSeason.checked = lowSeason;
}

function renderMonthPage() {
    $month.textContent = billingInfo[page].month;
    if (page === 0) {
        $pageArrows[0].classList.remove("available");
    } else {
        $pageArrows[0].classList.add("available");
    }

    if (page === billingInfo.length - 1) {
        $pageArrows[1].classList.remove("available");
    } else {
        $pageArrows[1].classList.add("available");
    }
}

function renderBillingInfo() {
    const scheduledHours = +$scheduledHours.value;
    const onlineHours = +$onlineHours.value;
    const minutesWaiting = +$minutesWaiting.value;
    const minutesInSession = +$minutesInSession.value;
    const bonus = getBonus(minutesWaiting, minutesInSession);

    $paymentValue[page].textContent = numberWithCommas(
        (
            ((minutesWaiting * 2.5 + minutesInSession * usdPerHour) / 60 +
                bonus) *
            currencyRates[currency]
        ).toFixed(1)
    );
    $paymentUnits[page].textContent = currency;

    $onlineTimeValue[page].textContent = (
        (onlineHours / scheduledHours) *
        100
    ).toFixed(1);

    $timeWorkedValue[page].textContent = (
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

function setupErrorHtml(html) {
    document.body.insertAdjacentHTML("afterbegin", html);
}

let theme;
let currency;
let usdPerHour;
let lowSeason;
let billingInfo;
let currencyRates;
let page;
let sliding;

let $month;
let $pagesList;
let $pageArrows;
let $paymentValue;
let $paymentUnits;
let $onlineTimeValue;
let $timeWorkedValue;

let $currency;
let $scheduledHours;
let $onlineHours;
let $minutesWaiting;
let $minutesInSession;
let $usdPerHour;
let $lowSeason;

let $optionReset;
let $optionTheme;
