
import { PostgrestResponse } from '@supabase/supabase-js';

export function createMockPostgrestResponse<T>(
  data: T | null,
  error: any = null
): PostgrestResponse<T> {
  return {
    data: data as T,
    error,
    count: null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK'
  } as PostgrestResponse<T>;
}

export function createMockPostgrestArrayResponse<T>(
  data: T[],
  error: any = null
): PostgrestResponse<T[]> {
  return {
    data: data as T[],
    error,
    count: data ? data.length : null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK'
  } as PostgrestResponse<T[]>;
}
