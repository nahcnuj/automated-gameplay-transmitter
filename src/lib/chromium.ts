import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const _ = chromium.use(StealthPlugin());

export { _ as chromium };
