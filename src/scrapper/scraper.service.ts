import { Injectable } from "@nestjs/common";
import { chromium } from "playwright";
import inquirer from "inquirer";
import { ScraperHelper } from "./helpers/scraper.helper";

@Injectable()
export class ScraperService {
  constructor(private readonly scraperHelper: ScraperHelper) {}
  async scrapePurchases() {
    const browser = await chromium.launch({
      headless: false, // 👈 Shows the browser
      slowMo: 100, // 👈 Slows down actions (optional)
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log("Navigating to Amazon login page...");
      await page.goto(
        "https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2Fref%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0",
        {
          waitUntil: "networkidle",
          timeout: 60000,
        }
      );

      // const { username, password } = await inquirer.prompt([
      //   {
      //     type: "input",
      //     name: "username",
      //     message: "Enter your Amazon email:",
      //   },
      //   {
      //     type: "password",
      //     name: "password",
      //     message: "Enter your Amazon password:",
      //     mask: "*",
      //   },
      // ]);
      await page.fill("#ap_email", "9110376162");
      await page.click("#continue");

      await page.waitForSelector("#ap_password", { timeout: 10000 });
      await page.fill("#ap_password", "Saiga@1403");
      // await page.screenshot({
      //   path: "/Users/saiganesh/fx/web_scrapper/password_playwright.png",
      // });

      console.log("Logging in...");
      await Promise.all([
        page.waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 10000,
        }),
        page.click("#signInSubmit"),
      ]);

      if (page.url().includes("ap/signin")) {
        throw new Error("Login might have failed. Still on signin page.");
      }

      console.log("Navigating to orders page...");
      await page.getByRole("link", { name: "Returns & Orders" }).click();

      // Wait for filter dropdown and select year
      await page.waitForSelector("#a-autoid-1-announce");
      await page.locator("#a-autoid-1-announce").click();
      await page.getByLabel("2023").getByText("2023", { exact: true }).click();

      // ✅ Wait for order blocks to load
      await page.waitForSelector(".order-card__list", { timeout: 15000 });
      // await page.pause();
      const orders = await page.evaluate(() => {
        const orderBlocks: Element[] = Array.from(
          document.getElementsByClassName("order-card__list")
        );
        const orders: any = [];
        const productImageBlock =
          orderBlocks[0].getElementsByClassName("product-image")[0];
        const linkElement =
          productImageBlock?.getElementsByClassName("a-link-normal")[0];
        const href = linkElement?.getAttribute("href");
        const alt = linkElement?.querySelector("img")?.getAttribute("alt");
        const texts = Array.from(
          orderBlocks[0].getElementsByClassName(
            "a-size-base a-color-secondary aok-break-word"
          )
        ).map((el) => el.textContent?.trim());
        orders.push({
          name: alt,
          link: `https://www.amazon.in${href}`,
          price: texts[1],
        });

        // orderBlocks.forEach((block) => {
        //   const products = block.querySelectorAll('a[href*="/gp/product"]');
        //   products.forEach((anchor) => {
        //     const name = anchor.textContent?.trim();
        //     const link = anchor.getAttribute("href");
        //     const price =
        //       block.querySelector(".a-color-price")?.textContent?.trim() ||
        //       block.querySelector(".a-color-secondary")?.textContent?.trim();

        //     if (name && link) {
        //       orders.push({
        //         name,
        //         price: price || "N/A",
        //         link: `https://www.amazon.in${link}`,
        //       });
        //     }
        //   });
        // });

        return orders;
      });
      console.log("Orders:", orders);

      console.log("Scraping complete!", orders);

      await browser.close();
      return orders;
    } catch (err: any) {
      await browser.close();
      console.error("Scraping error:", err);
      throw new Error(`Amazon scrape failed: ${err.message}`);
    }
  }

  async scrapeProductInfo(page: any) {
    const productName = await page.$eval(
      ".a-size-base a-color-base",
      (element: any) => element.textContent
    );
    const productPrice = await page.$eval(
      ".a-size-base a-color-secondary",
      (element: any) => element.textContent
    );
    const productLink = await page.$eval(
      ".a-size-base a-color-base",
      (element: any) => element.getAttribute("href")
    );

    const productInfo = {
      name: productName,
      price: productPrice,
      link: productLink,
    };

    return productInfo;
  }
}
