import { Page } from "playwright";
import { OrdersListInterface } from "../interfaces/scraper.interface";
import { AMAZON_CONSTANTS } from "../constants/amazon.constants";
import inquirer from "inquirer";

export class ScraperHelper {
  private async clickFilter(page: Page, filter: string) {
    await page.waitForSelector("#a-autoid-1-announce");
    await page.locator("#a-autoid-1-announce").click();
    await page.getByLabel(filter).getByText(filter).click();
  }

  private async waitForOrders(page: Page): Promise<boolean> {
    try {
      await page.waitForSelector(".order-card__list", { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  private async extractOrdersFromPage(
    page: Page
  ): Promise<OrdersListInterface[]> {
    return await page.evaluate(() => {
      const orderBlocks = Array.from(
        document.getElementsByClassName("order-card__list")
      );
      const orders: any[] = [];

      for (const block of orderBlocks) {
        const productImageBlock =
          block.getElementsByClassName("product-image")[0];
        const linkElement =
          productImageBlock?.getElementsByClassName("a-link-normal")[0];
        const href = linkElement?.getAttribute("href");
        const alt = linkElement?.querySelector("img")?.getAttribute("alt");
        const texts = Array.from(
          block.getElementsByClassName(
            "a-size-base a-color-secondary aok-break-word"
          )
        ).map((el) => el.textContent?.trim());

        if (alt && href && texts.length > 1) {
          orders.push({
            name: alt,
            link: `https://www.amazon.in${href}`,
            price: texts[1],
          });
        }

        if (orders.length >= 10) break;
      }

      return orders;
    });
  }

  public async extractOrders(page: Page): Promise<any[]> {
    const allOrders: any[] = [];

    for (const filter of AMAZON_CONSTANTS.YEAR_FILTERS) {
      console.log(`Switching to filter: ${filter}`);

      try {
        await this.clickFilter(page, filter);

        const hasOrders = await this.waitForOrders(page);
        if (!hasOrders) {
          console.warn(`No orders found for filter: ${filter}, skipping...`);
          continue;
        }

        const newOrders = await this.extractOrdersFromPage(page);
        allOrders.push(...newOrders);

        if (allOrders.length >= 10) {
          console.log("10 orders collected. Stopping...");
          break;
        }
      } catch (err) {
        console.warn(`Error in filter ${filter}:`, err);
        continue;
      }
    }

    return allOrders.slice(0, 10);
  }

  async handleAuthentication(page: Page): Promise<void> {
    const { otpCode } = await inquirer.prompt([
      {
        type: "input",
        name: "otpCode",
        message: "Enter your otp code you got in your mobile:",
      },
    ]);
    await page.getByRole("textbox", { name: "Enter OTP:" }).click();
    await page.getByRole("textbox", { name: "Enter OTP:" }).fill(otpCode);
    await page.getByRole("button", { name: "Sign in" }).click();
  }

  async loginToAmazon(
    page: Page,
    username: string,
    password: string
  ): Promise<void> {
    await page.goto(AMAZON_CONSTANTS.SIGN_IN_URL, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.fill("#ap_email", username);
    await page.click("#continue");
    await page.waitForSelector("#ap_password", { timeout: 10000 });
    await page.fill("#ap_password", password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }),
      page.click("#signInSubmit"),
    ]);

    if (page.url().includes("ap/mfa")) {
      await this.handleAuthentication(page);
    }

    if (page.url().includes("ap/signin")) {
      throw new Error("Login failed");
    }
    console.log("Login successful");
  }

  async navigateToOrders(page: Page): Promise<void> {
    await page.getByRole("link", { name: "Returns & Orders" }).click();
  }

  async fetchSearchResults(page: Page): Promise<OrdersListInterface[] | any> {
    await page.getByRole("searchbox", { name: "Search Amazon.in" }).click();
    const { searchArray } = await inquirer.prompt([
      {
        type: "input",
        name: "searchArray",
        message:
          "Enter search strings as an array of string to fetch the items available in Amazon:",
      },
    ]);
    await page
      .getByRole("searchbox", { name: "Search Amazon.in" })
      .fill(searchArray);
    await page.getByRole("button", { name: "Go", exact: true }).click();

    await page.waitForSelector(
      ".a-link-normal.s-line-clamp-3.s-link-style.a-text-normal",
      { timeout: 10000 }
    );

    const docs = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        ".a-link-normal.s-line-clamp-3.s-link-style.a-text-normal"
      );

      return Array.from(elements).map((el) => ({
        text: el.textContent?.trim(),
        href: (el as HTMLAnchorElement).href,
        price:'0'
      }));
    });

    console.log("Search Results:", docs);
    return docs;
  }
}
