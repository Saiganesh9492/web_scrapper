import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Browser, chromium } from "playwright";
import { ScraperHelper } from "./helpers/scraper.helper";
import inquirer from "inquirer";

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
    const context = await this.browser.newContext();
    const page = await context.newPage();
    await this.scraperHelper.loginToAmazon(page, "9110376162", "Saiga@1403");
    return await this.scraperHelper.fetchSearchResults(page);
  }

  async scrapePurchases() {
    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      console.log("Starting Amazon purchase scraping...");
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

      await this.scraperHelper.loginToAmazon(page, "9110376162", "Saiga@1403");
      await this.scraperHelper.navigateToOrders(page);
      const orders = await this.scraperHelper.extractOrders(page);

      console.log("Scraping complete:", orders);

      await context.close();
      return orders;
    } catch (err: any) {
      await context.close();
      console.error("Scraping error:", err);
      return [{ error: err.message }];
    }
  }
}
