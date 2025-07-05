# 🛒 Amazon Order Scraper

A **NestJS-based CLI tool** that uses **Playwright** to log into your Amazon account and scrape details of your **last 10 purchased items**.

> ⚠️ **For personal use only.** Use responsibly. Avoid scraping protected or third-party accounts without permission.

---

## 📦 Tech Stack

- **[NestJS](https://nestjs.com/)** – Scalable Node.js framework  
- **[Playwright](https://playwright.dev/)** – Headless browser automation  
- **[Inquirer](https://www.npmjs.com/package/inquirer)** – Interactive CLI prompts  
- **TypeScript** – Static typing for JS

---

## 🚀 Features

- Logs into your Amazon account using secure CLI prompts.
- Navigates to the **Returns & Orders** section.
- Scrapes up to **10 recent orders** with:
  - ✅ Product name
  - ✅ Purchase link
  - ✅ Price
- Includes optional product **search** and **filter** functionality.

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone git@github.com:Saiganesh9492/web_scrapper.git
cd web_scrapper
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Service

```bash
npm run start:dev
```

---

## 📡 Usage

### a. 📋 Fetch recent 10 orders

```bash
curl -X POST http://localhost:3000/scrape/
```

### b. 🔍 Search products with sorting filters

```bash
curl -X POST http://localhost:3000/scrape/search
```

You'll be prompted for your:
- ✅ Amazon login credentials (email & password)
- ✅ OTP (if 2FA is enabled)
- ✅ Search terms
- ✅ Optional sort filters

---

## ✅ Prerequisites

- **Node.js** ≥ 18  
- **npm** ≥ 9  
- A personal **Amazon account** (with at least 1 order)

> 💡 Playwright will automatically download the required browser binaries on first run.

---

## ⚙️ Configuration

All scraping logic is located in:

```
src/scrapper/scraper.service.ts  
src/scrapper/helpers/scraper.helper.ts  
```

Amazon filters and constants are defined in:

```
src/scrapper/constants/amazon.constants.ts
```

---

## 📸 Example Output

```json
[
  {
    "name": "boAt Rockerz 255 Pro+ Bluetooth Earphones",
    "price": "₹1,499",
    "link": "https://www.amazon.in/gp/product/B097R26HXP"
  },
  {
    "name": "Logitech MX Master 3",
    "price": "₹6,495",
    "link": "https://www.amazon.in/gp/product/B07W6JG6ZP"
  }
]
```

---

## 🧪 Development Tips

To debug browser actions visually:

```ts
const browser = await chromium.launch({ headless: false, slowMo: 100 });
```

To pause execution manually during a scrape:

```ts
await page.pause();
```

---

## 📄 License

This project is for **educational and personal use** only.  
It is **not affiliated with or endorsed by Amazon**.

---

## 👨‍💻 Author

**Saiganesh Sampathirao**  
🔗 [GitHub Profile](https://github.com/Saiganesh9492)
