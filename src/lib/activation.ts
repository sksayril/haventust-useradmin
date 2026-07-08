import SystemSetting from "@/models/SystemSetting";

const DEFAULT_ACTIVATION_PRICE = "500";

export async function getActivationPrice(): Promise<number> {
  const setting = await SystemSetting.findOne({ key: "activationPrice" }).lean();
  const raw = setting?.value ?? DEFAULT_ACTIVATION_PRICE;
  const price = Number(raw);
  return Number.isFinite(price) && price >= 0 ? price : Number(DEFAULT_ACTIVATION_PRICE);
}

export function isFreeActivation(price: number): boolean {
  return price === 0;
}
