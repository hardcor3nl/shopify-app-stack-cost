# shopify-app-stack-cost

Price a stack of Shopify apps at a given monthly order volume from plan data. Pure functions, no dependencies, ES modules, Node 20 or newer.

**Live demo:** https://storecartel.com/shopify-app-cost-calculator/ (pick an example stack and an order volume). The cost figures there are computed from the dataset below with this kind of logic.

It adds up list prices (monthly billing, free trials ignored) for the plan each line names. A line can name one plan, or a map from order volume to plan when the right plan changes as volume grows. If an app or plan is missing from the data it throws, so you never get a quietly wrong total.

## Use

```js
import { stackCost, stackCostByVolume, usd } from "./src/stack-cost.js";

const res = await fetch("https://storecartel.com/data/shopify-app-costs.json"); // CORS enabled, CC BY 4.0
const { apps } = await res.json();

const lines = [
  { slug: "some-app-slug", plan: "Plan name" },
  { slug: "another-app-slug", plan: { "100": "Starter", "2000": "Unlimited" } },
];
console.log(usd(stackCost(apps, lines, 500).total));
console.log(stackCostByVolume(apps, lines, [100, 500, 2000]));
```

The app slugs and plan names are in the dataset; the live calculator shows three worked example stacks.

## Test

```
npm test
```

(`node --test`, nothing to install. The tests use synthetic apps with made-up prices.)

## Data licence

The dataset is CC BY 4.0: credit StoreCartel and link to https://storecartel.com/shopify-app-cost-calculator/. Prices are list prices on the checked date and vendors change them without notice. The code in this repository is MIT, see [LICENSE](./LICENSE). Credit line, please: "Stack cost logic by StoreCartel (https://storecartel.com)".
