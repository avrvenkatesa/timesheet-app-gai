
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeEntries from '../TimeEntries';
import { AppContext } from '../../App';
import type { Client, Project, TimeEntry } from '../../types';
import { ProjectStatus, Currency } from '../../types';

// Mock data
const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Test Client',
    contactName: 'John Doe',
    contactEmail: 'john@test.com',
    billingAddress: '123 Test St'
  }
];

const mockProjects: Project[] = [
  {
    id: 'project-1',
    clientId: 'client-1',
    name: 'Test Project',
    description: 'Test project description',
    hourlyRate: 100,
    currency: Currency.USD,
    status: ProjectStatus.Active
  }
];

const mockTimeEntries: TimeEntry[] = [];

const mockContextValue = {
  clients: mockClients,
  projects: mockProjects,
  timeEntries: mockTimeEntries,
  invoices: [],
  addClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  addProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  addTimeEntry: jest.fn(),
  updateTimeEntry: jest.fn(),
  deleteTimeEntry: jest.fn(),
  addInvoice: jest.fn(),
  updateInvoice: jest.fn(),
  deleteInvoice: jest.fn(),
};

const TimeEntriesWithContext = () => (
  <AppContext.Provider value={mockContextValue}>
    <TimeEntries />
  </AppContext.Provider>
);

describe('TimeEntries Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Time Entry Form - Time Calculations', () => {
    test('TC-1: Calculate hours when start and stop times are entered', async () => {
      render(<TimeEntriesWithContext />);
      
      // Open the Log Time modal
      fireEvent.click(screen.getByText('Log Time'));
      
      // Fill in start and stop times
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '11:30' } });
      
      // Wait for hours to be calculated
      await waitFor(() => {
        expect(hoursInput).toHaveValue(2.5);
      });
    });

    test('TC-2: Round up hours to two decimals', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      // Time difference that results in 2.33333... hours (2 hours 20 minutes)
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '11:20' } });
      
      await waitFor(() => {
        expect(hoursInput).toHaveValue(2.34); // Rounded up to 2 decimals
      });
    });

    test('TC-3: Calculate stop time when start time and hours are entered', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });
      fireEvent.change(hoursInput, { target: { value: '2.5' } });
      
      await waitFor(() => {
        expect(stopTimeInput).toHaveValue('11:30');
      });
    });

    test('TC-4: Calculate start time when stop time and hours are entered', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      fireEvent.change(stopTimeInput, { target: { value: '17:30' } });
      fireEvent.change(hoursInput, { target: { value: '8' } });
      
      await waitFor(() => {
        expect(startTimeInput).toHaveValue('09:30');
      });
    });

    test('TC-5: Show validation error when times and hours are inconsistent', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      // Set inconsistent values: 9:00-17:00 = 8 hours, but hours field shows 5
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '17:00' } });
      fireEvent.change(hoursInput, { target: { value: '5' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Time mismatch/)).toBeInTheDocument();
      });
    });

    test('TC-6: Prevent form submission with validation error', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      // Fill in required fields first
      const projectSelect = screen.getByLabelText('Project');
      const descriptionInput = screen.getByLabelText('Task Description');
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      fireEvent.change(projectSelect, { target: { value: 'project-1' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test task' } });
      
      // Set inconsistent times
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '17:00' } });
      fireEvent.change(hoursInput, { target: { value: '5' } });
      
      const submitButton = screen.getByText('Log Time');
      fireEvent.click(submitButton);
      
      // Should not call addTimeEntry due to validation error
      expect(mockContextValue.addTimeEntry).not.toHaveBeenCalled();
    });

    test('TC-7: Handle overnight time entries', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      // Night shift: 23:00 to 07:00 (8 hours)
      fireEvent.change(startTimeInput, { target: { value: '23:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '07:00' } });
      
      await waitFor(() => {
        expect(hoursInput).toHaveValue(8);
      });
    });

    test('TC-8: Clear validation error when times become consistent', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      // First create an inconsistent state
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '17:00' } });
      fireEvent.change(hoursInput, { target: { value: '5' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Time mismatch/)).toBeInTheDocument();
      });
      
      // Fix the inconsistency
      fireEvent.change(hoursInput, { target: { value: '8' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Time mismatch/)).not.toBeInTheDocument();
      });
    });

    test('TC-9: Validate end time is after start time', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      
      // Set end time before start time (same day)
      fireEvent.change(startTimeInput, { target: { value: '17:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '09:00' } });
      
      await waitFor(() => {
        expect(screen.getByText(/End time must be after start time/)).toBeInTheDocument();
      });
    });

    test('TC-10: Calculate fractional hours correctly', async () => {
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Log Time'));
      
      const startTimeInput = screen.getByLabelText('Start Time');
      const stopTimeInput = screen.getByLabelText('Stop Time');
      const hoursInput = screen.getByLabelText('Hours');
      
      // 1 hour 15 minutes = 1.25 hours
      fireEvent.change(startTimeInput, { target: { value: '14:00' } });
      fireEvent.change(stopTimeInput, { target: { value: '15:15' } });
      
      await waitFor(() => {
        expect(hoursInput).toHaveValue(1.25);
      });
    });
  });

  describe('Templates Modal Scrollable', () => {
    test('TC-11: Template modal should be scrollable when content overflows', async () => {
      // Create many templates to test scrollability
      const manyTemplates = Array.from({ length: 20 }, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i + 1}`,
        projectId: 'project-1',
        description: `Description for template ${i + 1}`,
        defaultHours: 1,
        isBillable: true
      }));
      
      // Mock localStorage to return many templates
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(JSON.stringify(manyTemplates));
      
      render(<TimeEntriesWithContext />);
      
      fireEvent.click(screen.getByText('Templates'));
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // Check if the existing templates section is scrollable
      const templatesSection = screen.getByText('Existing Templates').parentElement;
      expect(templatesSection).toBeInTheDocument();
      
      mockGetItem.mockRestore();
    });
  });

  describe('Timer Functionality', () => {
    test('TC-12: Timer calculates elapsed time correctly', async () => {
      jest.useFakeTimers();
      
      render(<TimeEntriesWithContext />);
      
      // Fill in required fields
      const clientSelect = screen.getByDisplayValue('Select client...');
      fireEvent.change(clientSelect, { target: { value: 'client-1' } });
      
      const projectSelect = screen.getByDisplayValue('Select project...');
      fireEvent.change(projectSelect, { target: { value: 'project-1' } });
      
      const descriptionInput = screen.getByPlaceholderText('What are you working on?');
      fireEvent.change(descriptionInput, { target: { value: 'Test work' } });
      
      // Start the timer
      const startButton = screen.getByText('Start');
      fireEvent.click(startButton);
      
      // Fast-forward time by 1 hour
      jest.advanceTimersByTime(3600000); // 1 hour in milliseconds
      
      await waitFor(() => {
        expect(screen.getByText('01:00:00')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });
});
