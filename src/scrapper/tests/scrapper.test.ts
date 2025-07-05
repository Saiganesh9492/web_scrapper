import { ScraperHelper } from '../helpers/scraper.helper';
import { Page } from 'playwright';
import inquirer from "inquirer";

jest.mock('inquirer');

describe('ScraperHelper', () => {
  let scraperHelper: ScraperHelper;
  let page: jest.Mocked<Page>;

  beforeEach(() => {
    scraperHelper = new ScraperHelper();

    page = {
      waitForSelector: jest.fn(),
      locator: jest.fn().mockReturnValue({
        click: jest.fn(),
      }),
      getByLabel: jest.fn().mockReturnValue({
        getByText: jest.fn().mockReturnValue({ click: jest.fn() }),
      }),
      getByRole: jest.fn().mockReturnValue({
        click: jest.fn(),
        fill: jest.fn(),
      }),
      fill: jest.fn(),
      click: jest.fn(),
      goto: jest.fn(),
      url: jest.fn(),
      waitForNavigation: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn(),
    } as any;
  });

  describe('clickFilter', () => {
    it('should click filter label and value', async () => {
      await scraperHelper['clickFilter'](page, '2024');
      expect(page.locator).toHaveBeenCalledWith('#a-autoid-1-announce');
      expect(page.getByLabel).toHaveBeenCalledWith('2024');
    });
  });

  describe('waitForOrders', () => {
    it('should return true if orders block exists', async () => {
      page.waitForSelector.mockResolvedValueOnce({} as any);
      const result = await scraperHelper['waitForOrders'](page);
      expect(result).toBe(true);
    });

    it('should return false if orders not found', async () => {
      page.waitForSelector.mockRejectedValueOnce(new Error('Timeout'));
      const result = await scraperHelper['waitForOrders'](page);
      expect(result).toBe(false);
    });
  });

  describe('handleAuthentication', () => {
    it('should prompt for OTP and fill it', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({ otpCode: '123456' });

      await scraperHelper.handleAuthentication(page);
      expect(page.getByRole).toHaveBeenCalledWith('textbox', { name: 'Enter OTP:' });
    });
  });

  describe('loginToAmazon', () => {
    it('should login and not throw error', async () => {
      page.url.mockReturnValue('https://www.amazon.in/home');
      await scraperHelper.loginToAmazon(page);
      expect(page.goto).toHaveBeenCalled();
      expect(page.click).toHaveBeenCalledWith('#signInSubmit');
    });

    it('should throw if redirected to signin again', async () => {
      page.url.mockReturnValue('https://www.amazon.in/ap/signin');
      await expect(
        scraperHelper.loginToAmazon(page)
      ).rejects.toThrow('Login failed');
    });
  });

  describe('navigateToOrders', () => {
    it('should click on Returns & Orders', async () => {
      await scraperHelper.navigateToOrders(page);
      expect(page.getByRole).toHaveBeenCalledWith('link', { name: 'Returns & Orders' });
    });
  });

  describe('fetchSearchResults', () => {
    it('should prompt for search input and perform search', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({ searchArray: 'keyboard' });

      await scraperHelper.fetchSearchResults(page);
      expect(page.getByRole).toHaveBeenCalledWith('searchbox', { name: 'Search Amazon.in' });
      expect(page.getByRole).toHaveBeenCalledWith('button', { name: 'Go', exact: true });
    });
  });
});
