import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth } from './contexts/AuthContext';
import MainApplication from './components/layout/MainApplication';

// Mock the useAuth hook
jest.mock('./contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the MainApplication component
jest.mock('./components/layout/MainApplication', () => () => <div>Main Application Content</div>);

describe('App', () => {
  beforeEach(() => {
    // Reset mock before each test
    useAuth.mockReset();
  });

  test('renders Authenticating... when loadingAuth is true', () => {
    useAuth.mockReturnValue({ currentUser: null, loadingAuth: true });
    render(<App />);
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    expect(screen.queryByText('Main Application Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Authentication failed. Please refresh.')).not.toBeInTheDocument();
  });

  test('renders MainApplication when currentUser is present and loadingAuth is false', () => {
    useAuth.mockReturnValue({ currentUser: { uid: '123' }, loadingAuth: false });
    render(<App />);
    expect(screen.getByText('Main Application Content')).toBeInTheDocument();
    expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
    expect(screen.queryByText('Authentication failed. Please refresh.')).not.toBeInTheDocument();
  });

  test('renders Authentication failed message when currentUser is null and loadingAuth is false', () => {
    useAuth.mockReturnValue({ currentUser: null, loadingAuth: false });
    render(<App />);
    expect(screen.getByText('Authentication failed. Please refresh.')).toBeInTheDocument();
    expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
    expect(screen.queryByText('Main Application Content')).not.toBeInTheDocument();
  });
});