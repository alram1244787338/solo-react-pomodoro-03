import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

function renderWithTheme(ui, options) {
  const result = render(<ThemeProvider>{ui}</ThemeProvider>, options);
  const originalRerender = result.rerender;
  result.rerender = (newUi) => originalRerender(<ThemeProvider>{newUi}</ThemeProvider>);
  return result;
}

export * from '@testing-library/react';
export { renderWithTheme };
