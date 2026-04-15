import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeleteUserButton } from '@/components/DeleteUserButton';
import userEvent from '@testing-library/user-event';

// Mock the server action
jest.mock('@/app/actions/admin', () => ({
    deleteUser: jest.fn(),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock useAuth
jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'admin-id', roles: ['ADMIN'] },
        isAdmin: true,
    }),
}));

describe('DeleteUserButton Component', () => {
    const mockUserId = 'user-123';
    const mockUserName = 'John Doe';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render delete button', () => {
        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={false}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('should show tooltip on hover', () => {
        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={false}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', 'Delete user');
    });

    it('should be disabled when user is protected', () => {
        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={true}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('title', 'Protected user');
    });

    it('should not be disabled when user is not protected', () => {
        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={false}
            />
        );

        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
    });

    it('should open confirmation modal when clicked', async () => {
        const user = userEvent.setup();

        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={false}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        // Modal should appear with user name
        expect(screen.getByText(`Delete ${mockUserName}?`)).toBeInTheDocument();
    });

    it('should not open modal when protected user button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={true}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        // Modal should not appear
        expect(screen.queryByText(`Delete ${mockUserName}?`)).not.toBeInTheDocument();
    });

    it('should display trash icon', () => {
        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={false}
            />
        );

        // Check for SVG icon
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
        render(
            <DeleteUserButton
                userId={mockUserId}
                userName={mockUserName}
                isProtected={false}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass('text-red-600');
        expect(button).toHaveClass('dark:text-red-400');
    });
});
