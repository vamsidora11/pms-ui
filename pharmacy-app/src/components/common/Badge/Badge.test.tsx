//import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import Badge from './Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders with label text', () => {
      render(<Badge label="New" />);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with role status', () => {
      render(<Badge label="Active" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders label inside span element', () => {
      render(<Badge label="Beta" />);
      const badge = screen.getByRole('status');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Base styles', () => {
    it('always applies base styles', () => {
      render(<Badge label="Test" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'px-2',
        'py-0.5',
        'text-xs',
        'font-medium',
        'whitespace-nowrap'
      );
    });
  });

  describe('Variants', () => {
    it('applies default variant by default', () => {
      render(<Badge label="Default" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-blue-600', 'text-white');
    });

    it('applies default variant when explicitly specified', () => {
      render(<Badge label="Default" variant="default" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-blue-600', 'text-white');
    });

    it('applies secondary variant styles', () => {
      render(<Badge label="Secondary" variant="secondary" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-gray-200', 'text-gray-800');
    });

    it('applies success variant styles', () => {
      render(<Badge label="Success" variant="success" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('applies warning variant styles', () => {
      render(<Badge label="Warning" variant="warning" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('applies error variant styles', () => {
      render(<Badge label="Error" variant="error" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('applies outline variant styles', () => {
      render(<Badge label="Outline" variant="outline" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('border', 'border-gray-300', 'text-gray-700', 'bg-transparent');
    });
  });

  describe('Custom className', () => {
    it('applies no additional classes by default', () => {
      render(<Badge label="Default" />);
      const badge = screen.getByRole('status');
      expect(badge.className).not.toContain('custom-class');
    });

    it('applies custom className', () => {
      render(<Badge label="Custom" className="custom-class" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('custom-class');
    });

    it('merges custom className with default styles', () => {
      render(<Badge label="Custom" className="ml-2 mt-1" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('ml-2', 'mt-1', 'bg-blue-600', 'text-white');
    });

    it('preserves base and variant classes with custom className', () => {
      render(<Badge label="Custom" variant="success" className="shadow-lg" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass(
        'inline-flex',
        'bg-green-100',
        'text-green-700',
        'shadow-lg'
      );
    });
  });

  describe('Label content', () => {
    it('renders short labels', () => {
      render(<Badge label="1" />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders long labels', () => {
      render(<Badge label="Very Long Badge Label" />);
      expect(screen.getByText('Very Long Badge Label')).toBeInTheDocument();
    });

    it('renders labels with numbers', () => {
      render(<Badge label="v2.0.1" />);
      expect(screen.getByText('v2.0.1')).toBeInTheDocument();
    });

    it('renders labels with special characters', () => {
      render(<Badge label="New!" />);
      expect(screen.getByText('New!')).toBeInTheDocument();
    });

    it('renders empty label', () => {
      render(<Badge label="" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('');
    });
  });

  describe('Whitespace handling', () => {
    it('applies whitespace-nowrap class', () => {
      render(<Badge label="No Wrap Text" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('whitespace-nowrap');
    });
  });

  describe('Combined props', () => {
    it('handles all props together', () => {
      render(
        <Badge
          label="Complete"
          variant="success"
          className="ml-4 uppercase"
        />
      );
      
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('Complete');
      expect(badge).toHaveClass(
        'bg-green-100',
        'text-green-700',
        'ml-4',
        'uppercase',
        'inline-flex',
        'rounded-md'
      );
    });
  });

  describe('Accessibility', () => {
    it('has status role for screen readers', () => {
      render(<Badge label="Live" variant="success" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders semantic HTML', () => {
      render(<Badge label="Accessible" />);
      const badge = screen.getByRole('status');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Multiple badges', () => {
    it('renders multiple badges independently', () => {
      render(
        <>
          <Badge label="First" variant="default" />
          <Badge label="Second" variant="success" />
          <Badge label="Third" variant="error" />
        </>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });
});