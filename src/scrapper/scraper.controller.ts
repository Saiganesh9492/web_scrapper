import { Controller, Post } from "@nestjs/common";
import { ScraperService } from "./scraper.service";

@Controller("scrape")
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async runScraper(): Promise<any> {
    return await this.scraperService.scrapePurchases();
  }
  @Post("search")
  async searchProduct(): Promise<any> {
    return await this.scraperService.searchProduct();
  }
}
