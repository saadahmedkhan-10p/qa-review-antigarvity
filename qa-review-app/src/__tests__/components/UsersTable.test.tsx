import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { UsersTable } from '@/components/UsersTable';
import '@testing-library/jest-dom';

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    );
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
    Pencil: () => <span data-testid="pencil-icon">Pencil</span>,
}));

// Mock DeleteUserButton
jest.mock('@/components/DeleteUserButton', () => ({
    DeleteUserButton: ({ userName }: { userName: string }) => (
        <button>Delete {userName}</button>
    ),
}));

const mockUsers = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        roles: JSON.stringify(['ADMIN']),
    },
    {
        id: '2',
        name: 'Reviewer User',
        email: 'reviewer@example.com',
        roles: JSON.stringify(['REVIEWER']),
    },
    {
        id: '3',
        name: 'Lead User',
        email: 'lead@example.com',
        roles: JSON.stringify(['REVIEW_LEAD']),
    },
];

describe('UsersTable', () => {
    it('renders the table with users', () => {
        render(<UsersTable users={mockUsers} />);

        expect(screen.getByText('All Users (3)')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('Reviewer User')).toBeInTheDocument();
        expect(screen.getByText('Lead User')).toBeInTheDocument();
    });

    it('renders correct badge styles for ADMIN role', () => {
        render(<UsersTable users={mockUsers} />);

        const adminRow = screen.getByText('Admin User').closest('tr');
        const adminBadge = within(adminRow!).getByText('Admin');

        // Check for the specific dark mode classes we added
        expect(adminBadge).toHaveClass('dark:bg-purple-600');
        expect(adminBadge).toHaveClass('dark:text-white');
    });

    it('renders correct badge styles for REVIEWER role', () => {
        render(<UsersTable users={mockUsers} />);

        const reviewerRow = screen.getByText('Reviewer User').closest('tr');
        const reviewerBadge = within(reviewerRow!).getByText('Reviewer');

        expect(reviewerBadge).toHaveClass('dark:bg-green-600');
        expect(reviewerBadge).toHaveClass('dark:text-white');
    });

    it('filters users by search query', () => {
        render(<UsersTable users={mockUsers} />);

        const searchInput = screen.getByPlaceholderText('Search by name or email...');
        fireEvent.change(searchInput, { target: { value: 'Admin' } });

        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.queryByText('Reviewer User')).not.toBeInTheDocument();
    });

    it('filters users by role', () => {
        render(<UsersTable users={mockUsers} />);

        const roleSelect = screen.getByRole('combobox');
        fireEvent.change(roleSelect, { target: { value: 'REVIEWER' } });

        expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
        expect(screen.getByText('Reviewer User')).toBeInTheDocument();
    });

    it('shows no users found message when filter matches nothing', () => {
        render(<UsersTable users={mockUsers} />);

        const searchInput = screen.getByPlaceholderText('Search by name or email...');
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

        expect(screen.getByText('No users found')).toBeInTheDocument();
    });
});
