import { z } from "zod";

export const vocabPartSchema = z.object({
  kanji: z.string(),
  romaji: z.array(z.string())
});

export const vocabWordSchema = z.object({
  kanji: z.string(),
  romaji: z.string(),
  english: z.string(),
  parts: z.array(vocabPartSchema)
});

export const themeOptions = [
  { value: "cooking", label: "Cooking & Food" },
  { value: "travel", label: "Travel & Transportation" },
  { value: "nature", label: "Nature & Environment" },
  { value: "business", label: "Business & Work" },
  { value: "technology", label: "Technology & Internet" },
  { value: "family", label: "Family & Relationships" },
  { value: "hobbies", label: "Hobbies & Entertainment" }
] as const;

// Create a tuple type for the theme values
type ThemeValues = typeof themeOptions[number]['value'];
const themeValues = themeOptions.map(option => option.value) as [ThemeValues, ...ThemeValues[]];

export const vocabGenerationRequestSchema = z.object({
  theme: z.enum(themeValues)
});

export const vocabGenerationResponseSchema = z.array(vocabWordSchema);

export type VocabPart = z.infer<typeof vocabPartSchema>;
export type VocabWord = z.infer<typeof vocabWordSchema>;
export type VocabGenerationRequest = z.infer<typeof vocabGenerationRequestSchema>;
export type VocabGenerationResponse = z.infer<typeof vocabGenerationResponseSchema>;