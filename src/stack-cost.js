/**
 * Price a stack of Shopify apps at a given monthly order volume from plan data. Pure functions, no dependencies.
 *
 * The data shape is the one served by the Shopify App Costs dataset
 * (https://storecartel.com/data/shopify-app-costs.json):
 *   { apps: [{ app, slug, plans: [{ plan, priceUsdMonthly, limits }] }] }
 *
 * A stack line names an app and a plan. The plan can be one name, or a map from order volume to plan name when
 * the right plan changes with volume (for example a reviews app whose unlimited tier is needed above a cap).
 *   { slug: "some-reviews-app", plan: { "100": "Starter", "2000": "Unlimited" } }
 *
 * Prices are list prices on monthly billing with free trials ignored. Nothing is looked up, guessed or converted:
 * if an app or plan is not in the data, this throws instead of returning a wrong total.
 */

/**
 * @typedef {{ plan: string, priceUsdMonthly: number, limits?: string | null }} Plan
 * @typedef {{ app: string, slug: string, plans: Plan[] }} App
 * @typedef {{ slug: string, plan: string | Record<string, string> }} StackLine
 */

const round2 = (n) => Math.round(n * 100) / 100;

/** "$1,234.50" */
export const usd = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Cost of one stack at one order volume.
 * @param {App[]} apps
 * @param {StackLine[]} lines
 * @param {number | string} volume orders per month; selects the plan when a line gives a per-volume map
 * @returns {{ total: number, lines: { app: string, plan: string, price: number, limits: string | null }[] }}
 */
export function stackCost(apps, lines, volume) {
  const v = String(volume);
  const priced = lines.map(({ slug, plan }) => {
    const planName = typeof plan === "string" ? plan : plan[v];
    if (planName === undefined) throw new Error(`no plan given for ${slug} at volume ${v}`);
    const app = apps.find((a) => a.slug === slug);
    const p = app?.plans.find((x) => x.plan === planName);
    if (!app || !p) throw new Error(`no data for ${slug} / ${planName}`);
    return { app: app.app, plan: p.plan, price: p.priceUsdMonthly, limits: p.limits ?? null };
  });
  return { total: round2(priced.reduce((s, l) => s + l.price, 0)), lines: priced };
}

/**
 * Cost of the same stack at several volumes.
 * @returns {Record<string, number>} volume to monthly total
 */
export function stackCostByVolume(apps, lines, volumes) {
  return Object.fromEntries(volumes.map((v) => [String(v), stackCost(apps, lines, v).total]));
}

/** How many times dearer the stack is at the high volume than at the low one (null when the low total is 0). */
export function growth(byVolume, low, high) {
  const a = byVolume[String(low)], b = byVolume[String(high)];
  return a > 0 ? b / a : null;
}
