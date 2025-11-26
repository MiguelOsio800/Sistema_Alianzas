import React, { useState, useEffect } from 'react';

// Helper function to check if a value is a plain object
const isObject = (item: any): item is Record<string, any> => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Deeply merges a source object into a target object.
 * This implementation uses `any` to avoid complex generic type issues with recursion.
 * @param target The initial state object, used as the base and for structural templates.
 * @param source The partial state object from storage to merge into the target.
 * @returns A new object with the merged state.
 */
const mergeDeep = (target: any, source: any): any => {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (isObject(sourceValue) && isObject(targetValue)) {
                // If both values are objects, recurse
                output[key] = mergeDeep(targetValue, sourceValue);
            } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                 // If both are arrays, handle merging for arrays of objects
                const template = targetValue[0];
                if (template && isObject(template)) {
                     output[key] = sourceValue.map((item: any) => {
                        // For each item in the source array, merge it with the template from the initial state
                        return isObject(item) ? mergeDeep(template, item) : item;
                    });
                } else {
                    // For arrays of primitives, or if initial array is empty, just use the source array
                    output[key] = sourceValue;
                }
            } else {
                // Otherwise, just assign the value from the source
                if (sourceValue !== undefined) {
                    output[key] = sourceValue;
                }
            }
        });
    }
    return output;
};


function usePersistentState<T>(key: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storageValue = window.localStorage.getItem(key);

            if (!storageValue || storageValue === 'null' || storageValue === 'undefined') {
                return initialState;
            }

            const parsed = JSON.parse(storageValue);
            
            // If the initial state is an object (or array), merge it deeply.
            // This ensures that if the stored data is from an older version,
            // any new properties from the initialState are added, preventing crashes.
            if (isObject(initialState) && isObject(parsed)) {
                return mergeDeep(initialState, parsed);
            }
            if (Array.isArray(initialState) && Array.isArray(parsed)) {
                 // Wrap in an object to correctly merge arrays
                 return mergeDeep({data: initialState}, {data: parsed}).data;
            }

            // For primitives (string, number, boolean), simply return the parsed value.
            return parsed;

        } catch (error) {
            console.error(`Error reading key “${key}” from localStorage. Falling back to initial state.`, error);
        }
        
        return initialState;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting key “${key}” in localStorage:`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default usePersistentState;