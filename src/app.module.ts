import { Module } from '@nestjs/common';
import { ScraperModule } from './scrapper/scraper.module';

@Module({
  imports: [ScraperModule],
})
export class AppModule {}
