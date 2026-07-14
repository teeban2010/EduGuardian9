import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

interface AuthResult {
  error: Error | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone: string,
    schoolId: string,
    schoolName: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const normalisePhone = (phone: string | null | undefined) => {
  let value = (phone ?? '').replace(/\D/g, '');
  if (value.startsWith('60')) value = `0${value.slice(2)}`;
  return value;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Unable to load profile:', error);
      setProfile(null);
      return;
    }

    setProfile(data ? (data as Profile) : null);
  };

  useEffect(() => {
    const initialiseAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) await fetchProfile(currentSession.user.id);
      setLoading(false);
    };

    initialiseAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) await fetchProfile(newSession.user.id);
        else setProfile(null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone: string,
    schoolId: string,
    schoolName: string,
  ): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          phone: phone.trim(),
          school_id: schoolId,
          school_name: schoolName,
        },
      },
    });

    if (error) return { error: new Error(error.message) };

    if (data.user && data.session) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          role,
          phone: phone.trim(),
          school_id: schoolId,
          school_name: schoolName,
        })
        .eq('id', data.user.id);

      if (profileUpdateError) {
        console.error('Profile fallback update failed:', profileUpdateError);
      }

      await fetchProfile(data.user.id);
    }

    if (role === 'parent' && data.user) {
      const enteredPhone = normalisePhone(phone);
      const { data: pendingStudents, error: searchError } = await supabase
        .from('students')
        .select('id, parent_phone')
        .eq('school_id', schoolId)
        .is('parent_id', null)
        .ilike('parent_full_name', fullName.trim());

      if (searchError) {
        console.error('Unable to search pending students:', searchError);
      } else {
        const matchingStudentIds = (pendingStudents ?? [])
          .filter((student) => normalisePhone(student.parent_phone) === enteredPhone)
          .map((student) => student.id);

        if (matchingStudentIds.length > 0) {
          const { error: linkError } = await supabase
            .from('students')
            .update({
              parent_id: data.user.id,
              parent_link_status: 'Linked',
            })
            .in('id', matchingStudentIds);

          if (linkError) {
            console.error('Unable to link pending students:', linkError);
          }
        }
      }
    }

    return { error: null };
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<AuthResult> => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) await fetchProfile(user.id);
    return { error: error ? new Error(error.message) : null };
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}