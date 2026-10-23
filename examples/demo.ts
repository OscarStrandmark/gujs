import { Overlay, copyText, downloadText, flash, slugify, withOverlayState } from "../src/index.js";

interface Ingredient {
  amount: number;
  unit: string;
  name: string;
}

interface Recipe {
  title: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
}

function readRecipe(): Recipe {
  const root = document.querySelector<HTMLElement>("#recipe");
  if (!root) throw new Error("demo recipe markup is missing");

  return {
    title: root.querySelector(".recipe-title")?.textContent?.trim() ?? "Recipe",
    servings: Number(root.dataset["servings"] ?? 1),
    ingredients: [...root.querySelectorAll<HTMLElement>(".ingredient")].map((item) => ({
      amount: Number(item.dataset["amount"] ?? 0),
      unit: item.dataset["unit"] ?? "",
      name: item.dataset["name"] ?? item.textContent?.trim() ?? "",
    })),
    steps: [...root.querySelectorAll<HTMLElement>(".step")].map((step) => step.textContent?.trim() ?? ""),
  };
}

const recipe = readRecipe();

const defaults = withOverlayState(
  {
    servings: recipe.servings,
    units: "metric",
    round: true,
    ingredients: true,
    steps: true,
    numbered: true,
    note: "",
    optionsOpen: true,
  },
  { w: 460, h: 600 },
);

type DemoState = typeof defaults;

const gui = new Overlay<DemoState>({
  id: "gujs-demo",
  title: "Recipe Scaler",
  storageKey: "gujs.demo.recipe.v1",
  defaults,
  hotkey: "ctrl+alt+r",
  launcher: { label: "🍳 Scale recipe" },
  onSync: render,
});

const options = gui.section({ title: "Options", openKey: "optionsOpen" });
options.slider({
  label: "Servings",
  key: "servings",
  min: 1,
  max: 16,
  format: (value) => `Servings: ${value}`,
});
options.select({
  label: "Units",
  key: "units",
  options: [
    { value: "metric", label: "Metric (g, ml)" },
    { value: "us", label: "US (oz, cups)" },
  ],
});
options.checkbox({ label: "Round amounts", key: "round" });
options.checkbox({ label: "Ingredients", key: "ingredients" });
options.checkbox({ label: "Steps", key: "steps" });
options.checkbox({ label: "Numbered", key: "numbered", sub: true, enabledWhen: "steps" });
options.text({ label: "Note", key: "note", placeholder: "e.g. Double the feta" });

const preview = gui.preview({ title: "Shopping list" });

gui.buttons([
  {
    label: "Copy",
    onClick: async (button) => {
      flash(button, (await copyText(preview.value)) ? "Copied!" : "Copy failed");
    },
  },
  {
    label: "Save .txt",
    onClick: () => downloadText(`${slugify(recipe.title)}.txt`, preview.value, "text/plain;charset=utf-8"),
  },
  {
    label: "Reset servings",
    onClick: () => {
      gui.store.patch({ servings: recipe.servings });
      gui.sync();
    },
  },
]);

function convert(amount: number, unit: string, system: string): [number, string] {
  if (system !== "us") return [amount, unit];
  if (unit === "g") return amount >= 454 ? [amount / 453.6, "lb"] : [amount / 28.35, "oz"];
  if (unit === "ml") {
    if (amount >= 60) return [amount / 236.6, "cup"];
    if (amount >= 15) return [amount / 14.79, "tbsp"];
    return [amount / 4.93, "tsp"];
  }
  return [amount, unit];
}

function formatAmount(amount: number, unit: string, round: boolean): string {
  if (!round) return String(Math.round(amount * 100) / 100);
  if (unit === "g" || unit === "ml") {
    return String(amount >= 20 ? Math.round(amount / 5) * 5 : Math.round(amount));
  }
  const quarters = Math.max(1, Math.round(amount * 4));
  const whole = Math.floor(quarters / 4);
  const fraction = ["", "¼", "½", "¾"][quarters % 4] ?? "";
  return whole > 0 ? `${whole}${fraction ? ` ${fraction}` : ""}` : fraction;
}

function render(state: DemoState): void {
  const factor = state.servings / recipe.servings;
  const out: string[] = [`${recipe.title} (serves ${state.servings})`, ""];

  if (state.note.trim()) out.push(`Note: ${state.note.trim()}`, "");

  if (state.ingredients) {
    out.push("Ingredients");
    for (const item of recipe.ingredients) {
      const [amount, unit] = convert(item.amount * factor, item.unit, state.units);
      const quantity = formatAmount(amount, unit, state.round);
      out.push(`- ${quantity}${unit ? ` ${unit}` : ""} ${item.name}`);
    }
    out.push("");
  }

  if (state.steps) {
    out.push("Steps");
    recipe.steps.forEach((step, index) => out.push(`${state.numbered ? `${index + 1}.` : "-"} ${step}`));
  }

  preview.value = out.join("\n").trimEnd();
  gui.setBadge(`×${Math.round(factor * 100) / 100}`);
  gui.setStatus(
    `${recipe.servings} → ${state.servings} servings`,
    `${recipe.ingredients.length} ingredients`,
  );
}

gui.mount();
