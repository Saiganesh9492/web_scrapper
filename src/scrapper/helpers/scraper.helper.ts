import { Injectable } from '@nestjs/common';

@Injectable()
export class ScraperHelper {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) { }

  getProductNameAndLinks(block: Element): {name: string,link: string} | {} {
        const productImageBlock = block.getElementsByClassName("product-image")[0];
        const linkElement = productImageBlock?.getElementsByClassName("a-link-normal")[0];
        const href = linkElement?.getAttribute("href");
        const alt = linkElement?.querySelector("img")?.getAttribute("alt");
        return {
          name: alt,
          link: `https://www.amazon.in${href}`,
        };
  }
}
