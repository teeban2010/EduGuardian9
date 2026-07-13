import { createTheme, alpha } from '@mui/material/styles';
const PRIMARY = '#2563EB';
const SECONDARY = '#0891B2';

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: PRIMARY, light: '#3B82F6', dark: '#1D4ED8', contrastText: '#fff' },
        secondary: { main: SECONDARY, light: '#22D3EE', dark: '#0E7490', contrastText: '#fff' },
        background: { default: '#F8FAFC', paper: '#FFFFFF' },
        success: { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#fff' },
        error: { main: '#EF4444', light: '#F87171', dark: '#DC2626', contrastText: '#fff' },
        warning: { main: '#F59E0B', light: '#FCD34D', dark: '#D97706', contrastText: '#fff' },
        info: { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED', contrastText: '#fff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#fff' },
        secondary: { main: '#22D3EE', light: '#67E8F9', dark: '#0891B2', contrastText: '#000' },
        background: { default: '#0F172A', paper: '#1E293B' },
        success: { main: '#34D399', light: '#6EE7B7', dark: '#10B981', contrastText: '#000' },
        error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444', contrastText: '#000' },
        warning: { main: '#FCD34D', light: '#FDE68A', dark: '#F59E0B', contrastText: '#000' },
        info: { main: '#A78BFA', light: '#C4B5FD', dark: '#8B5CF6', contrastText: '#000' },
      },
    },
  },
  cssVariables: true,
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
  shape: { borderRadius: 12 },
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
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
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
    MuiAccordion: {
      defaultProps: { elevation: 0 },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 8 } },
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
          },
        }),
      },
    },
  },
});

export default theme;
