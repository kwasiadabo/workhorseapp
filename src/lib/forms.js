// Converts empty-string form values to `undefined` so optional Zod fields
// (e.g. `.email().optional()`) don't fail validation on an empty input,
// and so the API receives omitted fields instead of empty strings.
export const cleanPayload = (values) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === '' ? undefined : value]));
