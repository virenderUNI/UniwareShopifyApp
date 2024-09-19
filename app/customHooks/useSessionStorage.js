import { useState, useEffect } from 'react';

const useSessionStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : initialValue;
            } catch (error) {
                console.error("Error reading sessionStorage", error);
                return initialValue;
            }
        }
        return initialValue;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem(key, JSON.stringify(storedValue));
            } catch (error) {
                console.error("Error setting sessionStorage", error);
            }
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};

export default useSessionStorage;