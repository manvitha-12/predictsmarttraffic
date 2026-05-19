import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { predictTraffic, type TrafficInput } from "@/lib/ml";

const InputSchema = z.object({
  hour: z.number().int().min(0).max(23),
  day_of_week: z.number().int().min(0).max(6).optional(),
  temperature: z.number().min(-40).max(60),
  rain: z.number().int().min(0).max(5),
  holiday: z.number().int().min(0).max(1),
  junction: z.number().int().min(1).max(10),
  vehicles: z.number().int().min(0).max(5000),
  nearby_events: z.number().int().min(0).max(10).optional(),
});

export const predictTrafficFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const result = predictTraffic(data as TrafficInput);
    const { error } = await supabaseAdmin.from("predictions").insert({
      hour: data.hour,
      day_of_week: data.day_of_week ?? new Date().getDay(),
      temperature: data.temperature,
      rain: data.rain,
      holiday: data.holiday,
      junction: data.junction,
      vehicles: data.vehicles,
      nearby_events: data.nearby_events ?? 0,
      prediction: result.prediction,
      confidence: result.confidence,
    });
    if (error) console.error("insert prediction error", error);
    return result;
  });

export type PredictionRow = {
  id: string;
  hour: number;
  day_of_week: number;
  temperature: number;
  rain: number;
  holiday: number;
  junction: number;
  vehicles: number;
  nearby_events: number;
  prediction: string;
  confidence: number;
  created_at: string;
};

export const getHistoryFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(d ?? {}))
  .handler(async ({ data }): Promise<{ rows: PredictionRow[]; error: string | null }> => {
    const { data: rows, error } = await supabaseAdmin
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) {
      console.error(error);
      return { rows: [], error: error.message };
    }
    return { rows: (rows ?? []) as PredictionRow[], error: null };
  });
