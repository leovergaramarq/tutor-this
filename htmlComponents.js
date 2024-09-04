import { BILLING_URL } from "./constants.js";

export const containerHtml = `
    <div class="container">
        <div class="pages">
            <span class="pages-arrow arrow-left">
                <div><img src="./assets/icons/arrow-left-dark.svg"></div>
            </span>
            <span class="pages-arrow arrow-right">
                <div><img src="./assets/icons/arrow-left-dark.svg"></div>
            </span>
            <div class="month"></div>
            <ul></ul>
        </div>
        <div>
            <hr />
            <div class="custom-area">
                <div class="custom-area__title">Custom values</div>
                <div class="custom-area__list">
                    <div
                        class="custom-field currency"
                        title="Currency of your bank"
                    >
                        <span>Currency:</span>
                        <select></select>
                    </div>
                    <div
                        class="custom-field scheduled-hours"
                        title="Hours that you scheduled in Schedule Manager"
                    >
                        <span>Scheduled hours:</span>
                        <input type="number" min="0" />
                    </div>
                    <div
                        class="custom-field online-hours"
                        title="Hours online from the scheduled hours"
                    >
                        <span>Online hours:</span>
                        <input type="number" min="0" />
                    </div>
                    <div
                        class="custom-field minutes-waiting"
                        title="Minutes waiting from the scheduled hours"
                    >
                        <span>Minutes waiting:</span>
                        <input type="number" min="0" />
                    </div>
                    <div
                        class="custom-field minutes-in-session"
                        title="Minutes worked in any session"
                    >
                        <span>Minutes in session:</span>
                        <input type="number" min="0" />
                    </div>
                    <div
                        class="custom-field usd-per-hour"
                        title="USD earned per hour in session"
                    >
                        <span>USD per hour:</span>
                        <input type="number" min="0" />
                    </div>
                    <div
                        class="custom-field low-season"
                        title="Whether it's currently low season in Tutor.com"
                    >
                        <span>Low season:</span>
                        <div>
                            <input type="checkbox" id="checkbox" />
                            <label for="checkbox"></label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

export const pageHtml = `
    <li>
        <div class="page main-content">
            <section class="section-payment">
                <div class="section-title">Payment</div>
                <div class="section-data">
                    <span class="section-data__value payment-value"></span>
                    <span class="section-data__units payment-units"></span>
                </div>
            </section>
            <section class="section-online-time">
                <div class="section-title">Online time</div>
                <div class="section-data">
                    <span
                        class="section-data__value online-time-value"
                    ></span>
                    <span class="section-data__units online-time-units"
                        >%</span
                    >
                </div>
            </section>
            <section class="section-time-worked">
                <div class="section-title">Time worked</div>
                <div class="section-data">
                    <span
                        class="section-data__value time-worked-value"
                    ></span>
                    <span class="section-data__units time-worked-units"
                        >hours</span
                    >
                </div>
            </section>
        </div>
    </li>
`;

export const optionsAreaHtml = `
    <div class="options-area">
        <span class="option option-theme" title="Toggle theme">
            <div>
                <img
                    class="unselectable"
                    src="./assets/icons/theme-dark.svg"
                    alt="Toggle theme"
                />
            </div>
        </span>
    </div>
`;

export const optionResetHtml = `
    <span class="option option-reset" title="Reset data">
        <div>
            <img
                class="unselectable"
                src="./assets/icons/reset-dark.svg"
                alt="Reset"
            />
        </div>
    </span>
`;

export const wrongSiteHtml = `
    <div class="wrong-site">
        Extension available for the Tutor.com <a href="${BILLING_URL}" target="_blank">Billing Info</a> site.
    </div>
`;

export const errorHtml = `
    <div class="error">
        An error occurred.
    </div>
`;
