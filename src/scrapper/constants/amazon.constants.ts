export const AMAZON_CONSTANTS = {
  SIGN_IN_URL:
    "https://www.amazon.in/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.in%2Fref%3Dnav_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0",

  YEAR_FILTERS: [
    "past 3 months",
    "2025",
    "2024",
    "2023",
    "2022",
    "2021",
    "2020",
    "2019",
    "2018",
  ],

  AMAZON_FILTER_MAP: {
    0: "Featured",
    1: "Newest Arrivals",
    2: "Best Sellers",
    3: "Price: Low to High",
    4: "Price: High to Low",
    5: "Avg. Customer Ratings",
    6: "Newest Arrivals",
    7: "Price: High to Low",
    8: "Price: Low to High",
    9: "Price: High to Low",
    10: "Price: Low to High",
  },
};

export const FILTER_SELECTION_MESSAGE =
  `Choose the filters you want to apply from the list below. ` +
  `choose any one filter from the list (e.g., 0,3,4):\n` +
  `0: Featured\n` +
  `1: Newest Arrivals\n` +
  `2: Best Sellers\n` +
  `3: Price: Low to High\n` +
  `4: Price: High to Low\n` +
  `5: Avg. Customer Ratings\n`;

export const AMAZON_FILTER_MAP: Record<
  number,
  { label: string; selector: string }
> = {
  0: { label: "Featured", selector: "#s-result-sort-select_0" },
  1: { label: "Newest Arrivals", selector: "#s-result-sort-select_4" },
  2: { label: "Best Sellers", selector: "#s-result-sort-select_5" },
  3: { label: "Price: Low to High", selector: "#s-result-sort-select_1" },
  4: { label: "Price: High to Low", selector: "#s-result-sort-select_2" },
  5: { label: "Avg. Customer Review", selector: "#s-result-sort-select_3" },
};
