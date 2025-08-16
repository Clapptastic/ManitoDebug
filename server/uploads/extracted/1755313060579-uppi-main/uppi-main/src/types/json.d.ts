
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
export type Json = JsonPrimitive | JsonObject | JsonArray;

export interface JsonRecord<T> {
  [key: string]: T;
}

export interface JsonResponse<T> {
  data: T;
  error: string | null;
}
