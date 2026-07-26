import { AppContext, type AppContextType } from '@/context/app.context';
import { useContext } from 'react';

/**
 * Hook برای دسترسی به App Context (Theme + RTL)
 * @throws Error اگر AppProvider میں نباشد
 */
export function useAppContext(): AppContextType {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error('useAppContext نباید AppProvider بیرون استفاده شود');
    }

    return context;
}
