interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

export function isNativeApp(): boolean {
  const cap = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
  return typeof cap !== "undefined" && cap?.isNativePlatform?.() === true;
}