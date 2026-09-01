"use server";

import { createClient } from "@/lib/supabase/server";
import { pinToEmail } from "@/lib/pin";

export async function loginConPin(pin: string) {
  const pinLimpio = pin.trim();

  if (!pinLimpio) {
    return { error: "Ingresa tu PIN." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: pinToEmail(pinLimpio),
    password: pinLimpio,
  });

  if (error) {
    return { error: "PIN incorrecto." };
  }

  return { error: null };
}