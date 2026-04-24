import { render, screen } from '@testing-library/react';
import App from './App';

test('renders booking navigation', () => {
  render(<App />);
  expect(screen.getAllByText(/book/i)[0]).toBeInTheDocument();
});
