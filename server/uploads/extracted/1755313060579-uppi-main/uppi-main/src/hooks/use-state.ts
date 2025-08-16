
import { useState as reactUseState, type Dispatch, type SetStateAction } from 'react';

/**
 * Simple wrapper around React's useState hook with explicit typing
 * 
 * @param initialValue The initial state value
 * @returns A stateful value and a function to update it
 */
export function useState<T>(initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  return reactUseState<T>(initialValue);
}
