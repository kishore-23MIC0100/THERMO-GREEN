import { render, screen, cleanup } from '@testing-library/react';
import { it, expect, afterEach } from 'vitest';
import { Metric, tempDisplay } from './primitives';
afterEach(cleanup);
it('never presents a missing reading as zero', () => {
  render(<Metric label="Temperature" value={null} unit="°C" claim="MEASURED" detail="No sensor" />);
  expect(screen.getByText('Unavailable')).toBeInTheDocument();
  expect(screen.getByText('UNAVAILABLE')).toBeInTheDocument();
  expect(screen.queryByText('MEASURED')).not.toBeInTheDocument();
});
it('formats display units without modifying recorded values', () => {
  expect(tempDisplay(0, 'F')).toBe('32.0 °F');
  expect(tempDisplay(null, 'C')).toBe('Unavailable');
});
