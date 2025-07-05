import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScraperHelper } from './helpers/scraper.helper';

@Module({
  controllers: [ScraperController],
  providers: [ScraperService, ScraperHelper],

})
export class ScraperModule {}
