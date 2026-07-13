import React, { createContext, useContext, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha } from '@mui/material';

interface ColorModeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

const PRIMARY = '#2563EB';
const SECONDARY = '#0891B2';

function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: mode === 'light'
        ? { main: PRIMARY, light: '#3B82F6', dark: '#1D4ED8', contrastText: '#fff' }
        : { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#fff' },
      secondary: mode === 'light'
        ? { main: SECONDARY, light: '#22D3EE', dark: '#0E7490', contrastText: '#fff' }
        : { main: '#22D3EE', light: '#67E8F9', dark: '#0891B2', contrastText: '#000' },
      success: mode === 'light'
        ? { main: '#10B981', light: '#34D399', dark: '#059669' }
        : { main: '#34D399', light: '#6EE7B7', dark: '#10B981' },
      error: mode === 'light'
        ? { main: '#EF4444', light: '#F87171', dark: '#DC2626' }
        : { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
      warning: mode === 'light'
        ? { main: '#F59E0B', light: '#FCD34D', dark: '#D97706' }
        : { main: '#FCD34D', light: '#FDE68A', dark: '#F59E0B' },
      info: mode === 'light'
        ? { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' }
        : { main: '#A78BFA', light: '#C4B5FD', dark: '#8B5CF6' },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0F172A',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 600, textTransform: 'none' },
          contained: ({ theme }) => ({
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
            '&:hover': { boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}` },
          }),
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiAppBar: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 20 } },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-root': {
              fontWeight: 700,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: `2px solid ${theme.palette.divider}`,
            },
          }),
        },
      },
    },
  });
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('colorMode') as 'light' | 'dark') || 'light';
  });

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const theme = buildTheme(mode);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
