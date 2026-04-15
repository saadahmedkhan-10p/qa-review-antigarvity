import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalSearch from '@/components/search/GlobalSearch';
import '@testing-library/jest-dom';

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve([
                {
                    type: 'project',
                    id: 'p1',
                    title: 'Test Project',
                    subtitle: 'Lead: Test Lead',
                    url: '/admin/projects',
                },
                {
                    type: 'review',
                    id: 'r1',
                    title: 'Test Review',
                    subtitle: 'Reviewer: Test Reviewer',
                    url: '/reviews/r1',
                },
            ]),
    })
) as jest.Mock;

describe('GlobalSearch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the search button initially', () => {
        render(<GlobalSearch />);
        expect(screen.getByText('Search...')).toBeInTheDocument();
        expect(screen.getByText('⌘')).toBeInTheDocument();
    });

    it('opens the modal when button is clicked', async () => {
        render(<GlobalSearch />);
        await act(async () => {
            fireEvent.click(screen.getByText('Search...'));
        });
        expect(screen.getByPlaceholderText('Search projects, reviews, users...')).toBeInTheDocument();
    });

    it('fetches data when modal opens', async () => {
        render(<GlobalSearch />);
        await act(async () => {
            fireEvent.click(screen.getByText('Search...'));
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/search/data');
        });
    });

    it('displays search results when typing', async () => {
        render(<GlobalSearch />);
        
        // Open modal
        const searchBtn = screen.getByText('Search...');
        await act(async () => {
            fireEvent.click(searchBtn);
        });

        // Wait for initial data load
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        const input = screen.getByPlaceholderText('Search projects, reviews, users...');
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'Test' } });
        });

        await waitFor(() => {
            expect(screen.getByText('Test Project')).toBeInTheDocument();
            expect(screen.getByText('Test Review')).toBeInTheDocument();
        });
    });

    it('closes modal when Escape is pressed', async () => {
        render(<GlobalSearch />);
        await act(async () => {
            fireEvent.click(screen.getByText('Search...'));
        });
        expect(screen.getByPlaceholderText('Search projects, reviews, users...')).toBeInTheDocument();

        await act(async () => {
            fireEvent.keyDown(screen.getByPlaceholderText('Search projects, reviews, users...'), {
                key: 'Escape',
                code: 'Escape',
            });
        });

        expect(screen.queryByPlaceholderText('Search projects, reviews, users...')).not.toBeInTheDocument();
    });
});
