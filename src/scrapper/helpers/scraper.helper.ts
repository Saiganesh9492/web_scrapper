import { Page } from "playwright";
import { OrdersListInterface } from "../interfaces/scraper.interface";
import { AMAZON_CONSTANTS } from "../constants/amazon.constants";

export class ScraperHelper {
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

    if (page.url().includes("ap/signin")) {
      throw new Error("Login failed");
    }
    console.log("Login successful");
  }

  async navigateToOrdersPage(page: Page): Promise<void> {
    await page.getByRole("link", { name: "Returns & Orders" }).click();
    await page.waitForSelector("#a-autoid-1-announce");
    await page.locator("#a-autoid-1-announce").click();
    await page.getByLabel("past 3 months").getByText("past 3 months").click();
    await page.locator("#a-autoid-1-announce").click();
    await page.getByLabel("2025").getByText("2025").click();
    await page.locator("#a-autoid-1-announce").click();
    await page.getByLabel("2024").getByText("2024").click();
    await page.locator("#a-autoid-1-announce").click();
    await page.getByLabel("2023").getByText("2023").click();
    await page.locator("#a-autoid-1-announce").click();
    // await page.locator("span").filter({ hasText: "2024" }).nth(3).click();
    // await page.getByLabel("2023").getByText("2023", { exact: true }).click();
    await page.waitForSelector(".order-card__list", { timeout: 15000 });
  }

  async extractOrders(page: Page): Promise<OrdersListInterface[]> {
    return await page.evaluate(() => {
      const orderBlocks: Element[] = Array.from(
        document.getElementsByClassName("order-card__list")
      );
      const orders: any[] = [];

      orderBlocks.forEach((block) => {
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

        if (alt && href && texts[1]) {
          orders.push({
            name: alt,
            link: `https://www.amazon.in${href}`,
            price: texts[1] ?? "N/A",
          });
        }
      });

      return orders;
    });
  }
  async navigateAndExtractOrders(page: Page): Promise<any[]> {
    const filters = ["past 3 months", "2025", "2024", "2023"];
    const allOrders: any[] = [];

    await page.getByRole("link", { name: "Returns & Orders" }).click();

    for (const filter of filters) {
      try {
        console.log(`⏳ Switching to filter: ${filter}`);
        await page.waitForSelector("#a-autoid-1-announce");
        await page.locator("#a-autoid-1-announce").click();
        await page.getByLabel(filter).getByText(filter).click();

        // ✅ Try to wait for orders block; if timeout, move to next filter
        await page.waitForSelector(".order-card__list", { timeout: 3000 });
      } catch (err) {
        console.warn(`⚠️ No orders found for filter: ${filter}, skipping...`);
        continue; // Move to the next filter
      }

      const newOrders = await page.evaluate(() => {
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

          if (orders.length >= 10) break; // Stop processing this block early
        }

        return orders;
      });

      allOrders.push(...newOrders);

      if (allOrders.length >= 10) break; // ✅ Stop looping through filters
    }

    return allOrders.slice(0, 10); // Ensure only 10 items
  }
}
