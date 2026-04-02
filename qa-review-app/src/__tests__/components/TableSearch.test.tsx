import React from 'react';
import { render, screen } from '@testing-library/react';
import { TableSearch } from '@/components/TableSearch';
import userEvent from '@testing-library/user-event';

describe('TableSearch Component', () => {
    const mockOnSearch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render with placeholder text', () => {
        render(<TableSearch placeholder="Search users..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search users...');
        expect(input).toBeInTheDocument();
    });

    it('should call onSearch when typing', async () => {
        const user = userEvent.setup();
        render(<TableSearch placeholder="Search..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search...');
        await user.type(input, 'test');

        expect(mockOnSearch).toHaveBeenCalled();
        expect(mockOnSearch).toHaveBeenCalledWith(expect.stringContaining('test'));
    });

    it('should update input value when typing', async () => {
        const user = userEvent.setup();
        render(<TableSearch placeholder="Search..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
        await user.type(input, 'John Doe');

        expect(input.value).toBe('John Doe');
    });

    it('should show clear button when input has value', async () => {
        const user = userEvent.setup();
        render(<TableSearch placeholder="Search..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search...');
        await user.type(input, 'test');

        const clearButton = screen.getByRole('button');
        expect(clearButton).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
        const user = userEvent.setup();
        render(<TableSearch placeholder="Search..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
        await user.type(input, 'test');
        expect(input.value).toBe('test');

        const clearButton = screen.getByRole('button');
        await user.click(clearButton);

        expect(input.value).toBe('');
        expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should have search icon', () => {
        render(<TableSearch placeholder="Search..." onSearch={mockOnSearch} />);

        // Check for SVG icon (search icon)
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('should handle empty search', async () => {
        const user = userEvent.setup();
        render(<TableSearch placeholder="Search..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search...');
        await user.type(input, 'test');
        await user.clear(input);

        expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should be accessible', () => {
        render(<TableSearch placeholder="Search users..." onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('Search users...');
        expect(input).toHaveAttribute('type', 'text');
    });
});
