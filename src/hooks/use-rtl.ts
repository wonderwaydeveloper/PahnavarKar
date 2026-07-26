/**
 * Hook برای شناسایی RTL (راستچین)
 */

import { useAppContext } from './use-app-context';

export function useRTL(): boolean {
    const { isRTL } = useAppContext();
    return isRTL;
}
