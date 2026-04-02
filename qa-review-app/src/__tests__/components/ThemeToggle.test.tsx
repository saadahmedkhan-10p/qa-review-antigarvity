import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/components/ThemeProvider';

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ThemeToggle Component', () => {
    it('should render without crashing', () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    });

    it('should be clickable', () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);
        // Button should still be in document after click
        expect(button).toBeInTheDocument();
    });
});
