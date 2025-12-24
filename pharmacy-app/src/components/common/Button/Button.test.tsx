import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders with React node children', () => {
      render(
        <Button>
          <span>Icon</span> Click me
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });

  describe('Type attribute', () => {
    it('defaults to button type', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders with submit type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Variants', () => {
    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-300', 'text-gray-800', 'hover:bg-gray-400');
    });

    it('applies danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('Base styles', () => {
    it('always applies base styles', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'rounded-lg', 'font-medium', 'transition');
    });
  });

  describe('Disabled state', () => {
    it('is not disabled by default', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not apply disabled styles when not disabled', () => {
      render(<Button>Enabled</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('opacity-50');
      expect(button).not.toHaveClass('cursor-not-allowed');
    });
  });

  describe('Click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('works without onClick handler', () => {
      render(<Button>No handler</Button>);
      
      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  describe('Custom className', () => {
    it('applies no additional classes by default', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('custom-class');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with default styles', () => {
      render(<Button className="mt-4 w-full">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mt-4', 'w-full', 'bg-blue-600', 'px-4', 'py-2');
    });
  });

  describe('Combined props', () => {
    it('handles all props together', () => {
      const handleClick = vi.fn();
      render(
        <Button
          type="submit"
          variant="danger"
          size="lg"
          disabled
          onClick={handleClick}
          className="custom-class"
        >
          Combined Props
        </Button>
      );

      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveClass('bg-red-600', 'px-6', 'py-3', 'text-lg', 'opacity-50', 'custom-class');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});