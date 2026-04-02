import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import userEvent from '@testing-library/user-event';

describe('ConfirmationModal Component', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(
            <ConfirmationModal
                isOpen={false}
                title="Test Title"
                message="Test Message"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Delete User"
                message="Are you sure you want to delete this user?"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText('Delete User')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();
    });

    it('should display delete and cancel buttons', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onConfirm when delete button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should have proper styling for destructive actions', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Delete Item"
                message="This action cannot be undone"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const deleteButton = screen.getByText('Delete');
        expect(deleteButton).toHaveClass('bg-red-600');
    });

    it('should have dialog role for accessibility', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should display long messages correctly', () => {
        const longMessage = 'This is a very long message that should wrap correctly and be displayed properly in the modal without breaking the layout or causing any issues with the UI.';

        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message={longMessage}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
});
