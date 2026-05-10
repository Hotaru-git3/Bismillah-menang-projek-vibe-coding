import * as React from 'react';
import { PieChart, pieClasses } from '@mui/x-charts/PieChart';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Expense } from '../utils/storage';
import { getCategoryColor, getMoodColor, LEGACY_MOOD_MAP, categoryColors } from '../utils/colors';

interface DoublePieChartProps {
  expenses: Expense[];
}

type ViewType = 'category' | 'mood';

export default function DoublePieChart({ expenses }: DoublePieChartProps): React.ReactElement {
  const [view, setView] = React.useState<ViewType>('category');
  
  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
    if (newView !== null) setView(newView);
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getPrimaryData = (type: ViewType) => {
    const grouped = expenses.reduce((acc, curr) => {
      let key = type === 'category' ? curr.category : curr.mood;
      if (type === 'mood') {
         key = key ? (LEGACY_MOOD_MAP[key] || key) : 'Biasa Aja';
      }
      acc[key] = (acc[key] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([label, amount]) => ({
      id: label,
      label,
      value: amount,
      percentage: totalAmount ? (amount / totalAmount) * 100 : 0,
      color: type === 'category' ? getCategoryColor(label) : getMoodColor(label),
    }));
  };

  const getNestedData = (parentType: ViewType, childType: ViewType) => {
    const primaryData = getPrimaryData(parentType);
    return primaryData.flatMap(parent => {
      const parentExpenses = expenses.filter(e => {
         let key = parentType === 'category' ? e.category : e.mood;
         if (parentType === 'mood') {
            key = key ? (LEGACY_MOOD_MAP[key] || key) : 'Biasa Aja';
         }
         return key === parent.id;
      });
      
      const childAmounts = parentExpenses.reduce((acc, curr) => {
        let key = childType === 'category' ? curr.category : curr.mood;
        if (childType === 'mood') {
           key = key ? (LEGACY_MOOD_MAP[key] || key) : 'Biasa Aja';
        }
        acc[key] = (acc[key] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(childAmounts).map(([childLabel, amount]) => {
        return {
          id: `${parent.id}-${childLabel}`,
          label: childLabel,
          value: amount,
          percentage: parent.value ? (amount / parent.value) * 100 : 0,
          color: childType === 'category' ? getCategoryColor(childLabel) : getMoodColor(childLabel),
        };
      });
    });
  };

  if (totalAmount === 0) {
    return <div className="text-center text-gray-400 py-10 text-sm font-medium">Belum ada data pengeluaran</div>;
  }

  const primaryData = getPrimaryData(view);
  const secondaryData = getNestedData(view, view === 'category' ? 'mood' : 'category');

  // Responsive radius
  const isMobile = window.innerWidth < 768;
  const innerRadius = isMobile ? 35 : 45;
  const middleRadius = isMobile ? 85 : 105;
  const outerRadius = isMobile ? 105 : 130;

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      <ToggleButtonGroup
        color="primary"
        size="small"
        value={view}
        exclusive
        onChange={handleViewChange}
        sx={{
          gap: '8px',
          "& .MuiToggleButtonGroup-grouped": {
             margin: '0 !important',
             border: '1px solid rgba(62,39,35,0.1) !important',
             borderRadius: '20px !important',
          },
          "& .MuiToggleButton-root": {
            textTransform: 'none',
            padding: '6px 20px',
            color: '#3E2723',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            "&.Mui-selected": {
              backgroundColor: 'rgba(62,39,35,0.08)',
              fontWeight: '600',
              color: '#3E2723',
            },
            "&:hover": {
              backgroundColor: 'rgba(62,39,35,0.04)',
            }
          }
        }}
      >
        <ToggleButton value="category">Kategori &rarr; Mood</ToggleButton>
        <ToggleButton value="mood">Mood &rarr; Kategori</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ width: '100%', aspectRatio: '1/1', maxWidth: '360px', mt: 2 }}>
        <PieChart
          series={[
            {
              innerRadius,
              outerRadius: middleRadius,
              paddingAngle: 1.5,
              data: primaryData,
              arcLabel: (item) => (item as any).percentage > 8 ? `${item.id}` : '',
              valueFormatter: ({ value }) => `Rp ${value.toLocaleString('id-ID')} (${((value / totalAmount) * 100).toFixed(0)}%)`,
              highlightScope: { fade: 'global', highlight: 'item' },
              highlighted: { additionalRadius: 3 },
              cornerRadius: 4,
            },
            {
              innerRadius: middleRadius + 4,
              outerRadius,
              paddingAngle: 1.5,
              data: secondaryData,
              arcLabel: (item) => (item as any).percentage > 15 ? `${(item as any).label}` : '',
              valueFormatter: ({ value }) => `Rp ${value.toLocaleString('id-ID')} (${((value / totalAmount) * 100).toFixed(0)}%)`,
              highlightScope: { fade: 'global', highlight: 'item' },
              highlighted: { additionalRadius: 3 },
              cornerRadius: 4,
            },
          ]}
          sx={{
            [`& .${pieClasses.arcLabel}`]: {
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              fill: '#ffffff',
              pointerEvents: 'none',
            },
          }}
          slotProps={{ legend: { hidden: true } as any }}
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
        />
      </Box>

      {/* Legends for both Category and Mood */}
      <div className="flex flex-col gap-4 w-full px-4 pt-4 border-t border-rk-brown/5 mt-4">
        <div className="flex flex-col gap-2">
          <p className="font-bold text-rk-brown/40 text-center uppercase tracking-widest text-[9px]">Kategori</p>
          <div className="flex flex-wrap justify-center gap-1.5">
             {Array.from(new Set(expenses.map(e => e.category))).filter(Boolean).map((label) => (
                <div key={label} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-rk-brown/5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getCategoryColor(label) }}></div>
                  <span className="text-[10px] font-medium text-rk-brown/80">{label}</span>
                </div>
             ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-bold text-rk-brown/40 text-center uppercase tracking-widest text-[9px]">Mood</p>
          <div className="flex flex-wrap justify-center gap-1.5">
             {Array.from(new Set(expenses.map(e => {
                let key = e.mood;
                return key ? (LEGACY_MOOD_MAP[key] || key) : 'Biasa Aja';
             }))).map((label) => (
                <div key={label} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-rk-brown/5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getMoodColor(label) }}></div>
                  <span className="text-[10px] font-medium text-rk-brown/80">{label}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

