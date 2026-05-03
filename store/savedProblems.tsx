import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult } from '@/services/openai';

const STORAGE_KEY = '@math_helper_saved_scans_v1';

export interface SavedScan {
  id: string;
  savedAt: string;
  photoUri: string;
  result: AnalysisResult;
}

interface SavedProblemsState {
  scans: SavedScan[];
  loading: boolean;
  addScan: (photoUri: string, result: AnalysisResult) => Promise<SavedScan>;
  deleteScan: (id: string) => Promise<void>;
}

const SavedProblemsContext = createContext<SavedProblemsState | null>(null);

export function SavedProblemsProvider({ children }: { children: ReactNode }) {
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep a ref so callbacks always see the latest list without stale closures
  const scansRef = useRef<SavedScan[]>([]);
  const syncScans = useCallback((next: SavedScan[]) => {
    scansRef.current = next;
    setScans(next);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed: SavedScan[] = JSON.parse(raw);
          syncScans(parsed);
        }
      })
      .catch((err) => console.warn('[SavedProblems] load error:', err))
      .finally(() => setLoading(false));
  }, [syncScans]);

  const persist = useCallback(async (updated: SavedScan[]) => {
    const serialised = JSON.stringify(updated);
    await AsyncStorage.setItem(STORAGE_KEY, serialised);
    syncScans(updated);
  }, [syncScans]);

  const addScan = useCallback(
    async (photoUri: string, result: AnalysisResult): Promise<SavedScan> => {
      const scan: SavedScan = {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        photoUri,
        result,
      };
      // Always read from ref — never from stale closure
      const updated = [scan, ...scansRef.current];
      await persist(updated);
      return scan;
    },
    [persist]
  );

  const deleteScan = useCallback(
    async (id: string) => {
      const updated = scansRef.current.filter((s) => s.id !== id);
      await persist(updated);
    },
    [persist]
  );

  return (
    <SavedProblemsContext.Provider value={{ scans, loading, addScan, deleteScan }}>
      {children}
    </SavedProblemsContext.Provider>
  );
}

export function useSavedProblems(): SavedProblemsState {
  const ctx = useContext(SavedProblemsContext);
  if (!ctx) throw new Error('useSavedProblems must be used inside SavedProblemsProvider');
  return ctx;
}
