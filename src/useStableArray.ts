import { useRef } from 'react';

export const useStableArray = <T,>(value: T[]): T[] => {
    const ref = useRef(value);
    const isSame = ref.current.length === value.length && ref.current.every((item, i) => item === value[i]);
    if (!isSame) {
        ref.current = value;
    }
    return ref.current;
};
