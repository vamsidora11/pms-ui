import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Charts from './Chart';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, height }: { children: React.ReactNode; height: number }) => (
    <div data-testid="responsive-container" data-height={height}>
      {children}
    </div>
  ),
  LineChart: ({ data, children }: { data: unknown; children: React.ReactNode }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ data, children }: { data: unknown; children: React.ReactNode }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
    <div data-testid="cartesian-grid" data-stroke={strokeDasharray} />
  ),
  Line: ({ 
    type, 
    dataKey, 
    stroke, 
    strokeWidth 
  }: { 
    type: string; 
    dataKey: string; 
    stroke: string; 
    strokeWidth: number;
  }) => (
    <div
      data-testid="line"
      data-type={type}
      data-key={dataKey}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
    />
  ),
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />
  ),
}));

describe('Charts Component', () => {
  const mockData = [
    { month: 'Jan', sales: 100 },
    { month: 'Feb', sales: 200 },
    { month: 'Mar', sales: 150 },
  ];

  describe('Container styling', () => {
    it('renders with wrapper div containing correct classes', () => {
      const { container } = render(
        <Charts data={mockData} xKey="month" yKey="sales" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass(
        'w-full',
        'h-full',
        'border',
        'rounded-lg',
        'shadow-sm',
        'p-4',
        'bg-white'
      );
    });
  });

  describe('ResponsiveContainer', () => {
    it('renders ResponsiveContainer', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('uses default height of 300', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-height', '300');
    });

    it('uses custom height when provided', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" height={500} />);
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-height', '500');
    });
  });

  describe('LineChart rendering', () => {
    it('renders LineChart by default', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('renders LineChart when type is explicitly set to line', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="line" />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('passes data to LineChart', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-chart-data', JSON.stringify(mockData));
    });

    it('renders Line component with correct props', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-type', 'monotone');
      expect(line).toHaveAttribute('data-key', 'sales');
      expect(line).toHaveAttribute('data-stroke', '#2563eb');
      expect(line).toHaveAttribute('data-stroke-width', '2');
    });
  });

  describe('BarChart rendering', () => {
    it('renders BarChart when type is bar', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="bar" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('passes data to BarChart', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="bar" />);
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toHaveAttribute('data-chart-data', JSON.stringify(mockData));
    });

    it('renders Bar component with correct props', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="bar" />);
      const bar = screen.getByTestId('bar');
      expect(bar).toHaveAttribute('data-key', 'sales');
      expect(bar).toHaveAttribute('data-fill', '#16a34a');
    });
  });

  describe('Common chart components', () => {
    it('renders XAxis with correct dataKey for line chart', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toBeInTheDocument();
      expect(xAxis).toHaveAttribute('data-key', 'month');
    });

    it('renders XAxis with correct dataKey for bar chart', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="bar" />);
      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toBeInTheDocument();
      expect(xAxis).toHaveAttribute('data-key', 'month');
    });

    it('renders YAxis', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('renders Tooltip', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders CartesianGrid with correct strokeDasharray', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" />);
      const grid = screen.getByTestId('cartesian-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('data-stroke', '3 3');
    });
  });

  describe('Data handling', () => {
    it('handles empty data array', () => {
      render(<Charts data={[]} xKey="month" yKey="sales" />);
      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-chart-data', '[]');
    });

    it('handles different xKey values', () => {
      const customData = [
        { date: '2024-01', value: 100 },
        { date: '2024-02', value: 200 },
      ];
      render(<Charts data={customData} xKey="date" yKey="value" />);
      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toHaveAttribute('data-key', 'date');
    });

    it('handles different yKey values', () => {
      const customData = [
        { month: 'Jan', revenue: 1000 },
        { month: 'Feb', revenue: 2000 },
      ];
      render(<Charts data={customData} xKey="month" yKey="revenue" />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-key', 'revenue');
    });

    it('handles large datasets', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        index: i,
        value: Math.random() * 100,
      }));
      render(<Charts data={largeData} xKey="index" yKey="value" />);
      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-chart-data', JSON.stringify(largeData));
    });

    it('handles string values in data', () => {
      const stringData = [
        { category: 'A', count: 10 },
        { category: 'B', count: 20 },
        { category: 'C', count: 15 },
      ];
      render(<Charts data={stringData} xKey="category" yKey="count" />);
      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-chart-data', JSON.stringify(stringData));
    });

    it('handles numeric string values', () => {
      const numericStringData = [
        { month: 'Jan', sales: '100' },
        { month: 'Feb', sales: '200' },
      ];
      render(<Charts data={numericStringData} xKey="month" yKey="sales" />);
      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-chart-data', JSON.stringify(numericStringData));
    });
  });

  describe('Props combinations', () => {
    it('handles all props for line chart', () => {
      render(
        <Charts
          data={mockData}
          xKey="month"
          yKey="sales"
          type="line"
          height={400}
        />
      );
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toHaveAttribute(
        'data-height',
        '400'
      );
    });

    it('handles all props for bar chart', () => {
      render(
        <Charts
          data={mockData}
          xKey="month"
          yKey="sales"
          type="bar"
          height={600}
        />
      );
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toHaveAttribute(
        'data-height',
        '600'
      );
    });
  });

  describe('Type switching', () => {
    it('switches between line and bar chart types', () => {
      const { rerender } = render(
        <Charts data={mockData} xKey="month" yKey="sales" type="line" />
      );
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();

      rerender(<Charts data={mockData} xKey="month" yKey="sales" type="bar" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Chart styling', () => {
    it('applies correct stroke color to line chart', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="line" />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-stroke', '#2563eb');
    });

    it('applies correct fill color to bar chart', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="bar" />);
      const bar = screen.getByTestId('bar');
      expect(bar).toHaveAttribute('data-fill', '#16a34a');
    });

    it('applies correct stroke width to line', () => {
      render(<Charts data={mockData} xKey="month" yKey="sales" type="line" />);
      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-stroke-width', '2');
    });
  });
});