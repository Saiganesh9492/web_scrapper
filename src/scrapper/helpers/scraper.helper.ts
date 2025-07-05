import { Page } from "playwright";
import { OrdersListInterface } from "../interfaces/scraper.interface";
import {
  AMAZON_CONSTANTS,
  FILTER_SELECTION_MESSAGE,
  AMAZON_FILTER_MAP,
} from "../constants/amazon.constants";
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

  public async extractOrders(page: Page): Promise<OrdersListInterface[]> {
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

  async loginToAmazon(page: Page): Promise<void> {
    await page.goto(AMAZON_CONSTANTS.SIGN_IN_URL, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    const { username, password } = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Enter your Amazon email or number:",
        validate: (input: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phoneRegex = /^[6-9]\d{9}$/;

          if (!input.trim()) {
            return "Username cannot be empty.";
          }

          if (!emailRegex.test(input) && !phoneRegex.test(input)) {
            return "Enter a valid email or 10-digit phone number.";
          }

          return true;
        },
      },
      {
        type: "password",
        name: "password",
        message: "Enter your Amazon password:",
        mask: "*",
      },
    ]);
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
      throw new Error("Login failed due to invalid credentials");
    }
    console.log("Login successful");
  }

  async navigateToOrders(page: Page): Promise<void> {
    await page.getByRole("link", { name: "Returns & Orders" }).click();
  }

  private async promptSearchTerms(): Promise<string[]> {
    const { searchArray } = await inquirer.prompt([
      {
        type: "input",
        name: "searchArray",
        message:
          "Enter search strings as comma-separated values to fetch the items available on Amazon:",
      },
    ]);

    if (!searchArray) {
      throw new Error("Search array is empty");
    }

    return searchArray.split(",").map((s: string) => s.trim());
  }

  private async promptFilters(): Promise<number> {
    const { isFiltersNeeded } = await inquirer.prompt([
      {
        type: "input",
        name: "isFiltersNeeded",
        message: "Do you want to apply any filters? (yes/no):",
      },
    ]);

    if (isFiltersNeeded.toLowerCase() !== "yes") return -1;

    const { filter } = await inquirer.prompt([
      {
        type: "input",
        name: "filter",
        message: FILTER_SELECTION_MESSAGE,
      },
    ]);

    return Number(filter);
  }

  private async searchForTerm(page: Page, term: string): Promise<void> {
    await page.getByRole("searchbox", { name: "Search Amazon.in" }).fill(term);
    await page.getByRole("button", { name: "Go", exact: true }).click();
    await page.waitForSelector(".a-link-normal.s-link-style", {
      timeout: 10000,
    });
  }

  private async extractSearchResults(
    page: Page
  ): Promise<OrdersListInterface[]> {
    await page.waitForSelector(".a-link-normal");
    return await page.evaluate(() => {
      const items: any[] = [];
      const productLinks = document.querySelectorAll("a.a-link-normal");

      productLinks.forEach((anchor) => {
        const container = anchor.closest("div.s-result-item");

        const name = anchor.textContent?.trim() || "N/A";
        const href = anchor instanceof HTMLAnchorElement ? anchor.href : "";

        const priceWhole =
          container?.querySelector(".a-price-whole")?.textContent?.trim() || "";
        const priceFraction =
          container?.querySelector(".a-price-fraction")?.textContent?.trim() ||
          "";

        const price = priceWhole
          ? `₹${priceWhole}${priceFraction ? "." + priceFraction : ""}`
          : "N/A";

        if (name && href && price !== "N/A") {
          items.push({ name, link: href, price });
        }
      });

      return items;
    });
  }

  private async applySortFilter(
    page: Page,
    filterIndex: number
  ): Promise<void> {
    console.log(`🔍 Switching to filter: filterIndex ${filterIndex}`);
    await page.getByText(`Sort by:${AMAZON_FILTER_MAP[0].label}`).click();
    if (filterIndex === 0) return;
    const filter = AMAZON_FILTER_MAP[filterIndex];
    if (!filter) {
      console.warn(`Invalid filter index: ${filterIndex}`);
      return;
    }

    try {
      console.log(`Applying filter: "${JSON.stringify(filter)}"`);

      await page.getByLabel(filter.label).getByText(filter.label).click();
      await page.waitForSelector(".a-link-normal", {
        timeout: 5000,
      });
    } catch (err) {
      console.warn(`⚠️ Failed to apply filter "${filter.label}":`, err);
    }
  }

  public async fetchSearchResults(page: Page): Promise<OrdersListInterface[]> {
    const searchTerms = await this.promptSearchTerms();
    const filterIndex = await this.promptFilters();
    let allResults: OrdersListInterface[] = [];

    for (const term of searchTerms) {
      await this.searchForTerm(page, term);
      let products = await this.extractSearchResults(page);
      allResults.push(...products);

      if (filterIndex >= 0) {
        await this.applySortFilter(page, filterIndex);
        const sortedProducts = await this.extractSearchResults(page);
        allResults = [];
        allResults.push(...sortedProducts);
      }
    }

    console.log(`Total results collected: ${allResults.length}`);
    return allResults;
  }
}
