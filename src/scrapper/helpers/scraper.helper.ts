import { Page } from "playwright";
import { OrdersListInterface } from "../interfaces/scraper.interface";
import {
  AMAZON_CONSTANTS,
  FILTER_SELECTION_MESSAGE,
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
    const username = "9110376162";
    const password = "Saiga@1403";
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

  async fetchSearchResults(page: Page): Promise<OrdersListInterface[]> {
    await page.getByRole("searchbox", { name: "Search Amazon.in" }).click();

    const { searchArray, isFiltersNeeded } = await inquirer.prompt([
      {
        type: "input",
        name: "searchArray",
        message:
          "Enter search strings as comma-separated values to fetch the items available on Amazon:",
      },
      {
        type: "input",
        name: "isFiltersNeeded",
        message: "Do you want to apply any filters? (yes/no):",
      },
    ]);

    if (!searchArray) {
      throw new Error("Search array is empty");
    }

    const searchTerms = searchArray.split(",").map((s: string) => s.trim());
    let filters: string[] = [];

    if (isFiltersNeeded.toLowerCase() === "yes") {
      const filterPrompt = await inquirer.prompt([
        {
          type: "input",
          name: "filters",
          message: FILTER_SELECTION_MESSAGE,
        },
      ]);
      filters = filterPrompt.filters.split(",").map((f: string) => f.trim());
    }

    const allResults: OrdersListInterface[] = [];

    for (const term of searchTerms) {
      console.log(`🔍 Searching for: "${term}"`);

      await page
        .getByRole("searchbox", { name: "Search Amazon.in" })
        .fill(term);
      await page.getByRole("button", { name: "Go", exact: true }).click();

      await page.waitForSelector(".a-link-normal.s-link-style", {
        timeout: 10000,
      });

      const products = await page.evaluate(() => {
        const items: any[] = [];

        const productLinks = document.querySelectorAll(
          "a.a-link-normal.s-link-style"
        );

        productLinks.forEach((anchor) => {
          const container = anchor.closest("div.s-result-item");

          const name = anchor.textContent?.trim() || "N/A";
          const href = anchor instanceof HTMLAnchorElement ? anchor.href : "";

          const priceWhole =
            container?.querySelector(".a-price-whole")?.textContent?.trim() ||
            "";
          const priceFraction =
            container
              ?.querySelector(".a-price-fraction")
              ?.textContent?.trim() || "";

          const price = priceWhole
            ? `₹${priceWhole}${priceFraction ? "." + priceFraction : ""}`
            : "N/A";

          if (name && href && price) {
            items.push({ name, link: href, price });
          }
        });

        return items;
      });

      allResults.push(...products);

      // Optional: Apply filter interaction if needed (this part is Amazon-specific and can vary by UI)
      if (filters.length > 0) {
        console.log(`⚙️ Filters selected: ${filters.join(", ")}`);
        // You may need to inspect the filter buttons manually to add automation.
      }
    }

    console.log(`✅ Total results collected: ${allResults.length}`);
    return allResults;
  }
}
