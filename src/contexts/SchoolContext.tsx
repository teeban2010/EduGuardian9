import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { School } from '../types';

interface SchoolContextType {
  school: School | null;
  schoolId: string | null;
  setSchool: (school: School | null) => void;
  clearSchool: () => void;
  loading: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  searchSchools: (query: string) => Promise<School[]>;
  getSchoolByCode: (code: string) => Promise<School | null>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const SCHOOL_STORAGE_KEY = 'eduguardian_school';
const GUEST_STORAGE_KEY = 'eduguardian_guest';

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchoolState] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const loadSchool = async () => {
      const guestStored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guestStored === 'true') {
        setIsGuest(true);
      }

      const stored = localStorage.getItem(SCHOOL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const { data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('school_code', parsed.school_code)
            .eq('status', 'active')
            .maybeSingle();

          if (data && !error) {
            setSchoolState(data as School);
          } else {
            localStorage.removeItem(SCHOOL_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(SCHOOL_STORAGE_KEY);
        }
      }
      setLoading(false);
    };
    loadSchool();
  }, []);

  const setSchool = useCallback((newSchool: School | null) => {
    setSchoolState(newSchool);
    if (newSchool) {
      localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(newSchool));
    } else {
      localStorage.removeItem(SCHOOL_STORAGE_KEY);
    }
  }, []);

  const clearSchool = useCallback(() => {
    setSchoolState(null);
    setIsGuest(false);
    localStorage.removeItem(SCHOOL_STORAGE_KEY);
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }, []);

  const enterGuestMode = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }, []);

  const searchSchools = useCallback(async (query: string): Promise<School[]> => {
    if (!query || query.length < 2) return [];
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('status', 'active')
      .or(`school_name.ilike.%${query}%,school_code.ilike.%${query}%`)
      .order('school_name')
      .limit(20);
    if (error) return [];
    return (data as School[]) ?? [];
  }, []);

  const getSchoolByCode = useCallback(async (code: string): Promise<School | null> => {
    if (!code) return null;
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('school_code', code.toUpperCase())
      .eq('status', 'active')
      .maybeSingle();
    if (error) return null;
    return data as School | null;
  }, []);

  return (
    <SchoolContext.Provider
      value={{
        school,
        schoolId: school?.id ?? null,
        setSchool,
        clearSchool,
        loading,
        isGuest,
        enterGuestMode,
        exitGuestMode,
        searchSchools,
        getSchoolByCode,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within a SchoolProvider');
  return ctx;
}
