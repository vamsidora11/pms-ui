import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Checkbox from './Checkbox';

describe('Checkbox Component', () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders checkbox input', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Checkbox label="Accept terms" checked={false} onChange={mockOnChange} />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('renders without label', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.queryByText(/./)).not.toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <Checkbox
          label="Subscribe"
          description="Get weekly updates"
          checked={false}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Get weekly updates')).toBeInTheDocument();
    });

    it('renders without description', () => {
      render(<Checkbox label="Test" checked={false} onChange={mockOnChange} />);
      expect(screen.queryByText(/Get weekly updates/)).not.toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(
        <Checkbox
          label="Agree"
          checked={false}
          onChange={mockOnChange}
          error="This field is required"
        />
      );
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('renders without error message', () => {
      render(<Checkbox label="Test" checked={false} onChange={mockOnChange} />);
      expect(screen.queryByText(/required/)).not.toBeInTheDocument();
    });
  });

  describe('Checked state', () => {
    it('renders unchecked when checked is false', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('renders checked when checked is true', () => {
      render(<Checkbox checked={true} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Disabled state', () => {
    it('is not disabled by default', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      expect(screen.getByRole('checkbox')).not.toBeDisabled();
    });

    it('can be disabled', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('applies disabled styles to label', () => {
      const { container } = render(
        <Checkbox label="Test" checked={false} onChange={mockOnChange} disabled />
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('cursor-not-allowed', 'opacity-60');
    });

    it('does not apply disabled styles when enabled', () => {
      const { container } = render(
        <Checkbox label="Test" checked={false} onChange={mockOnChange} />
      );
      const label = container.querySelector('label');
      expect(label).not.toHaveClass('cursor-not-allowed');
      expect(label).not.toHaveClass('opacity-60');
    });
  });

  describe('Change handling', () => {
    it('calls onChange when clicked', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.click(checkbox);
      
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('passes event to onChange handler', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.click(checkbox);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            type: 'checkbox',
          }),
        })
      );
    });

    it('can be toggled multiple times', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Indeterminate state', () => {
    it('sets indeterminate property when indeterminate is true', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} indeterminate />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('does not set indeterminate by default', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(false);
    });

    it('updates indeterminate when prop changes', () => {
      const { rerender } = render(
        <Checkbox checked={false} onChange={mockOnChange} indeterminate={false} />
      );
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(false);

      rerender(<Checkbox checked={false} onChange={mockOnChange} indeterminate={true} />);
      expect(checkbox.indeterminate).toBe(true);
    });
  });

  describe('Error state', () => {
    it('applies error border color when error is present', () => {
      render(
        <Checkbox
          checked={false}
          onChange={mockOnChange}
          error="Error message"
        />
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('border-red-500');
    });

    it('applies default border color when no error', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('border-gray-400');
      expect(checkbox).not.toHaveClass('border-red-500');
    });

    it('displays error message in red', () => {
      render(
        <Checkbox
          checked={false}
          onChange={mockOnChange}
          error="Required field"
        />
      );
      const errorText = screen.getByText('Required field');
      expect(errorText).toHaveClass('text-red-500');
    });
  });

  describe('Styling', () => {
    it('applies base checkbox styles', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('w-4', 'h-4', 'border', 'rounded');
    });

    it('applies focus ring class', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('focus:ring-blue-500');
    });

    it('applies label cursor pointer class', () => {
      const { container } = render(
        <Checkbox label="Test" checked={false} onChange={mockOnChange} />
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('cursor-pointer');
    });

    it('applies select-none to label text', () => {
      const { container } = render(
        <Checkbox label="Test" checked={false} onChange={mockOnChange} />
      );
      const span = container.querySelector('span');
      expect(span).toHaveClass('select-none');
    });

    it('applies custom className to wrapper', () => {
      const { container } = render(
        <Checkbox
          checked={false}
          onChange={mockOnChange}
          className="custom-class"
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('merges custom className with default wrapper classes', () => {
      const { container } = render(
        <Checkbox
          checked={false}
          onChange={mockOnChange}
          className="mt-4"
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('mt-4', 'flex', 'flex-col', 'mb-2');
    });

    it('applies description text styles', () => {
      render(
        <Checkbox
          label="Test"
          description="Description"
          checked={false}
          onChange={mockOnChange}
        />
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-gray-500', 'text-sm', 'ml-6');
    });

    it('applies error text styles', () => {
      render(
        <Checkbox
          checked={false}
          onChange={mockOnChange}
          error="Error"
        />
      );
      const error = screen.getByText('Error');
      expect(error).toHaveClass('text-red-500', 'text-sm', 'ml-6', 'mt-1');
    });
  });

  describe('Accessibility', () => {
    it('has checkbox role', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('associates label with checkbox', () => {
      render(<Checkbox label="Test label" checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('Test label');
      expect(label.closest('label')).toContainElement(checkbox);
    });

    it('is keyboard accessible', () => {
      render(<Checkbox checked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });
  });

  describe('Combined props', () => {
    it('handles all props together', () => {
      render(
        <Checkbox
          label="Subscribe to newsletter"
          description="Get updates weekly"
          checked={true}
          onChange={mockOnChange}
          disabled={false}
          error="Please review"
          indeterminate={false}
          className="custom-wrapper"
        />
      );

      expect(screen.getByText('Subscribe to newsletter')).toBeInTheDocument();
      expect(screen.getByText('Get updates weekly')).toBeInTheDocument();
      expect(screen.getByText('Please review')).toBeInTheDocument();
      
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('Layout structure', () => {
    it('renders description below label', () => {
      const { container } = render(
        <Checkbox
          label="Label"
          description="Description"
          checked={false}
          onChange={mockOnChange}
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      const children = Array.from(wrapper.children);
      const labelIndex = children.findIndex(child => child.tagName === 'LABEL');
      const descIndex = children.findIndex(child => 
        child.textContent === 'Description'
      );
      
      expect(descIndex).toBeGreaterThan(labelIndex);
    });

    it('renders error below description', () => {
      const { container } = render(
        <Checkbox
          label="Label"
          description="Description"
          error="Error"
          checked={false}
          onChange={mockOnChange}
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      const children = Array.from(wrapper.children);
      const descIndex = children.findIndex(child => 
        child.textContent === 'Description'
      );
      const errorIndex = children.findIndex(child => 
        child.textContent === 'Error'
      );
      
      expect(errorIndex).toBeGreaterThan(descIndex);
    });
  });
});