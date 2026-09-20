import { z } from "zod";

export function required(message = "Required"): z.ZodString {
  return z.string().trim().min(1, message);
}

export function moneyOptional(message = "Enter a valid amount"): z.ZodString {
  return z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      message,
    );
}

export function moneyPositive(message = "Amount must be greater than 0"): z.ZodString {
  return z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) > 0, message);
}

export function phoneOptional(message = "Enter a valid phone number"): z.ZodString {
  return z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+\d][\d\s-]{5,}$/.test(v), message);
}

export function wholeNumberOptional(min: number, max: number, message: string): z.ZodString {
  return z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max),
      message,
    );
}