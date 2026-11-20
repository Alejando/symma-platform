import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render-with-intl';
import { DashboardKPIs } from '@/app/dashboard/_components/DashboardKPIs';
import { RoutineStatsCards } from './RoutineStatsCards';

const ACCURACY_FROM_API = 73;

describe('average gesture accuracy scale', () => {
  it('shows the same percentage on the dashboard and in routine analytics without rescaling', () => {
    renderWithIntl(
      <>
        <DashboardKPIs
          metrics={{
            activePatients: { value: 4, trend: 0 },
            complianceAlerts: { value: 0, trend: 0 },
            avgEfficacy: { value: ACCURACY_FROM_API, trend: 0 },
          }}
        />
        <RoutineStatsCards
          stats={{ totalSessions: 2, avgScore: ACCURACY_FROM_API, currentStreak: 1 }}
          averageSymmetry={null}
        />
      </>,
    );

    expect(screen.getAllByText('73%')).toHaveLength(2);
    expect(screen.getAllByText('Precisión promedio del gesto')).toHaveLength(2);
    expect(screen.queryByText('7300%')).not.toBeInTheDocument();
    expect(screen.queryByText('0.73%')).not.toBeInTheDocument();
  });

  it('shows average symmetry as its own metric and an honest empty state when there is none', () => {
    const { rerender } = renderWithIntl(
      <RoutineStatsCards stats={{ totalSessions: 2, avgScore: 73, currentStreak: 1 }} averageSymmetry={88} />,
    );

    expect(screen.getByText('Simetría facial promedio')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();

    rerender(<RoutineStatsCards stats={{ totalSessions: 2, avgScore: 73, currentStreak: 1 }} averageSymmetry={null} />);

    expect(screen.getByText('Aún no hay mediciones de simetría')).toBeInTheDocument();
  });
});
