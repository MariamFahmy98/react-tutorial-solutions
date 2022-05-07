import puppeteer from "puppeteer";

describe("Tic Tac Toe", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  it("contains the welcome text", async () => {
    await page.goto("http://localhost:80");
    await page.waitForSelector("#root > div > div.game-board > div:nth-child(1) > div > div:nth-child(2) > button:nth-child(2)");
    await page.click("#root > div > div.game-board > div:nth-child(1) > div > div:nth-child(2) > button:nth-child(2)");
    await page.waitForSelector("#root > div > div.game-board > div:nth-child(1) > div > div:nth-child(2) > button:nth-child(2)");
    const text = await page.$eval("#root > div > div.game-board > div:nth-child(1) > div > div:nth-child(2) > button:nth-child(2)", (e) => e.textContent);
    expect(text).toContain("X");
  });

  afterAll(() => browser.close());
});
