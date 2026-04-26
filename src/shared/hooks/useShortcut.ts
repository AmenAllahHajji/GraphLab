import { useContext, useEffect, useRef } from 'react';
import { ShortcutContext } from '../context/ShortcutContext';

type ShortcutCallback = (e: KeyboardEvent) => void;

export const useShortcut = (keys: string, callback: ShortcutCallback) => {
  const context = useContext(ShortcutContext);
  if (!context) throw new Error("useShortcut must be used within ShortcutProvider");

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => callbackRef.current(e);
    context.registerShortcut(keys, handler);
    return () => context.unregisterShortcut(keys, handler);
  }, [keys, context]);
};
