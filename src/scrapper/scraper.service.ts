import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Browser, chromium } from "playwright";
import { ScraperHelper } from "./helpers/scraper.helper";

@Injectable()
export class ScraperService implements OnModuleInit, OnModuleDestroy {
  private browser!: Browser;

  constructor(private readonly scraperHelper: ScraperHelper) {}

  async onModuleInit() {
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });
    console.log("Browser launched");
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      console.log("Browser closed");
    }
  }

  async searchProduct() {
    try {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      await this.scraperHelper.loginToAmazon(page);
      const searchResults = await this.scraperHelper.fetchSearchResults(page);
      return { data: searchResults, count: searchResults.length };
    } catch (error: any) {
      return [
        { message: "Please try with another product", error: error.message },
      ];
    }
  }

  async scrapePurchases(): Promise<{ data: any | [], count: number, error?: string }> {
    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      console.log("Starting Amazon purchase scraping...");
      await this.scraperHelper.loginToAmazon(page);
      await this.scraperHelper.navigateToOrders(page);
      const orders = await this.scraperHelper.extractOrders(page);

      console.log("Scraping complete:", orders);

      await context.close();
      return { data: orders, count: orders.length };
    } catch (err: any) {
      await context.close();
      console.error("Scraping error:", err);
      return {data: [], count: 0, error: err.message};
    }
  }
}
