import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, useTheme, alpha, Grid,
  Tab, Tabs, CircularProgress, Fade, Divider,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import IcecreamIcon from '@mui/icons-material/Icecream';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';

interface MenuItem {
  id: string;
  item_name: string;
  category: 'main' | 'drink' | 'snack' | 'dessert';
  price: number;
  description: string | null;
  is_available: boolean;
  sort_order: number;
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday'] as const;
type Day = typeof DAYS[number];

const DAY_LABELS: Record<Day, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
};

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  main:    { icon: <RestaurantIcon />,    label: 'Main Dishes', color: '#2563EB' },
  drink:   { icon: <LocalCafeIcon />,     label: 'Drinks',      color: '#0891B2' },
  snack:   { icon: <BakeryDiningIcon />,  label: 'Snacks',      color: '#F59E0B' },
  dessert: { icon: <IcecreamIcon />,      label: 'Desserts',    color: '#EC4899' },
};

function todayDay(): Day {
  const d = new Date().getDay();
  const map: Record<number, Day> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
  return map[d] ?? 'monday';
}

export default function CanteenMenu() {
  const theme = useTheme();
  const { school } = useSchool();
  const [menu, setMenu] = useState<Record<Day, MenuItem[]>>({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Day>(todayDay());

  useEffect(() => {
    if (!school?.id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('canteen_menus')
        .select('*')
        .eq('school_id', school.id)
        .order('sort_order');

      const grouped: Record<Day, MenuItem[]> = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };
      (data ?? []).forEach((item: MenuItem & { day_of_week: Day }) => {
        if (grouped[item.day_of_week]) grouped[item.day_of_week].push(item);
      });
      setMenu(grouped);
      setLoading(false);
    };
    load();
  }, [school?.id]);

  const dayItems = menu[selectedDay] ?? [];
  const categories = Array.from(new Set(dayItems.map((i) => i.category)));

  return (
    <Fade in>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#F59E0B', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RestaurantIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Menu Kantin</Typography>
            <Typography variant="body2" color="text.secondary">
              {school?.school_name} — Weekly canteen menu
            </Typography>
          </Box>
        </Box>

        {/* Day tabs */}
        <Card sx={{ mb: 3, borderColor: alpha(theme.palette.primary.main, 0.1) }}>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs
              value={selectedDay}
              onChange={(_, v) => setSelectedDay(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { minWidth: 'auto', px: 2.5, py: 1.75 } }}
            >
              {DAYS.map((day) => {
                const isToday = day === todayDay();
                return (
                  <Tab
                    key={day}
                    value={day}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {DAY_LABELS[day]}
                        {isToday && (
                          <Chip label="Today" size="small"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
            ) : dayItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <FastfoodIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" fontWeight={600}>No menu for {DAY_LABELS[selectedDay]}</Typography>
                <Typography variant="body2" color="text.secondary">The canteen menu hasn't been posted yet.</Typography>
              </Box>
            ) : (
              <Box>
                {categories.map((cat, catIdx) => {
                  const meta = CATEGORY_META[cat] ?? CATEGORY_META.main;
                  const items = dayItems.filter((i) => i.category === cat);
                  return (
                    <Box key={cat} sx={{ mb: catIdx < categories.length - 1 ? 4 : 0 }}>
                      {/* Category header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1.5, borderBottom: '2px solid', borderColor: alpha(meta.color, 0.15) }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(meta.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                          {meta.icon}
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: meta.color }}>{meta.label}</Typography>
                        <Chip size="small" label={`${items.length} item${items.length > 1 ? 's' : ''}`}
                          sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(meta.color, 0.1), color: meta.color }} />
                      </Box>

                      <Grid container spacing={2}>
                        {items.map((item) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                            <Box sx={{
                              p: 2.5, borderRadius: 3,
                              border: '1px solid',
                              borderColor: item.is_available ? alpha(meta.color, 0.15) : alpha('#94A3B8', 0.15),
                              bgcolor: item.is_available ? alpha(meta.color, 0.03) : alpha('#94A3B8', 0.03),
                              opacity: item.is_available ? 1 : 0.65,
                              transition: 'box-shadow 0.15s',
                              '&:hover': item.is_available ? { boxShadow: `0 4px 16px ${alpha(meta.color, 0.15)}` } : {},
                            }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>{item.item_name}</Typography>
                                {item.is_available
                                  ? <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', flexShrink: 0 }} />
                                  : <CancelIcon sx={{ fontSize: 16, color: '#94A3B8', flexShrink: 0 }} />
                                }
                              </Box>
                              {item.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.5 }}>
                                  {item.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={800} sx={{ color: meta.color }}>
                                  RM {item.price.toFixed(2)}
                                </Typography>
                                <Chip size="small"
                                  label={item.is_available ? 'Available' : 'Sold Out'}
                                  sx={{
                                    height: 20, fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px',
                                    bgcolor: item.is_available ? alpha('#10B981', 0.12) : alpha('#94A3B8', 0.12),
                                    color: item.is_available ? '#10B981' : '#64748B',
                                  }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {!loading && dayItems.length > 0 && (
          <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha('#F59E0B', 0.04)} 100%)`, borderColor: alpha(theme.palette.primary.main, 0.1) }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={800} color="primary.main">{dayItems.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Items</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#10B981' }}>{dayItems.filter((i) => i.is_available).length}</Typography>
                  <Typography variant="caption" color="text.secondary">Available</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#F59E0B' }}>
                    RM {Math.min(...dayItems.map((i) => i.price)).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">From</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Fade>
  );
}
