import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Drawer from './Drawer';

describe('Drawer Component', () => {
  const mockOnClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children when open', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Drawer content</p>
        </Drawer>
      );
      expect(screen.getByText('Drawer content')).toBeInTheDocument();
    });

    it('renders children when closed (drawer is always in DOM)', () => {
      render(
        <Drawer isOpen={false} onClose={mockOnClose}>
          <p>Drawer content</p>
        </Drawer>
      );
      expect(screen.getByText('Drawer content')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title="Settings">
          <p>Content</p>
        </Drawer>
      );
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders without title', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Open state', () => {
    it('shows backdrop when open', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      expect(backdrop).toBeInTheDocument();
    });

    it('hides backdrop when closed', () => {
      const { container } = render(
        <Drawer isOpen={false} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      expect(backdrop).not.toBeInTheDocument();
    });

    it('applies translate-x-0 class when open', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('translate-x-0');
      expect(drawer).not.toHaveClass('translate-x-full');
    });

    it('applies translate-x-full class when closed', () => {
      const { container } = render(
        <Drawer isOpen={false} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('translate-x-full');
      expect(drawer).not.toHaveClass('translate-x-0');
    });
  });

  describe('Backdrop interaction', () => {
    it('calls onClose when backdrop is clicked', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when drawer content is clicked', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Drawer content</p>
        </Drawer>
      );
      
      fireEvent.click(screen.getByText('Drawer content'));
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('applies base drawer styles', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass(
        'fixed',
        'top-0',
        'right-0',
        'h-full',
        'w-80',
        'bg-white',
        'shadow-lg',
        'p-6',
        'z-50',
        'transform',
        'transition-transform'
      );
    });

    it('applies backdrop styles', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      expect(backdrop).toHaveClass(
        'fixed',
        'inset-0',
        'bg-black/40',
        'z-40'
      );
    });

    it('applies title styles', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title="My Title">
          <p>Content</p>
        </Drawer>
      );
      const title = screen.getByText('My Title');
      expect(title).toHaveClass('text-xl', 'font-semibold', 'mb-4');
      expect(title.tagName).toBe('H2');
    });
  });

  describe('Z-index layering', () => {
    it('backdrop has z-40', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      expect(backdrop).toHaveClass('z-40');
    });

    it('drawer has z-50 (higher than backdrop)', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('z-50');
    });
  });

  describe('Position and dimensions', () => {
    it('drawer is positioned at top-right', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('fixed', 'top-0', 'right-0');
    });

    it('drawer has full height', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('h-full');
    });

    it('drawer has fixed width of 320px (w-80)', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('w-80');
    });

    it('backdrop covers entire viewport', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('Transition behavior', () => {
    it('has transition-transform class for animation', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('transition-transform');
    });

    it('changes transform class when toggling open state', () => {
      const { container, rerender } = render(
        <Drawer isOpen={false} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toHaveClass('translate-x-full');

      rerender(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      expect(drawer).toHaveClass('translate-x-0');
      expect(drawer).not.toHaveClass('translate-x-full');
    });
  });

  describe('Complex children', () => {
    it('renders multiple child elements', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <button>Action</button>
        </Drawer>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders nested components', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <div>
            <h3>Section Title</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Drawer>
      );
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles empty children', () => {
      render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          {null}
        </Drawer>
      );
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          {null}
        </Drawer>
      );
      const drawer = container.querySelector('.w-80');
      expect(drawer).toBeInTheDocument();
    });

    it('handles multiple onClose calls', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      const backdrop = container.querySelector('.bg-black\\/40');
      
      if (backdrop) {
        fireEvent.click(backdrop);
        fireEvent.click(backdrop);
        fireEvent.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it('renders with very long title', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      render(
        <Drawer isOpen={true} onClose={mockOnClose} title={longTitle}>
          <p>Content</p>
        </Drawer>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  describe('DOM structure', () => {
    it('renders fragment with backdrop and drawer', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Drawer>
      );
      
      // Should have backdrop
      const backdrop = container.querySelector('.bg-black\\/40');
      expect(backdrop).toBeInTheDocument();
      
      // Should have drawer
      const drawer = container.querySelector('.w-80');
      expect(drawer).toBeInTheDocument();
    });

    it('title appears before children in drawer', () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={mockOnClose} title="Title">
          <p>Content</p>
        </Drawer>
      );
      
      const drawer = container.querySelector('.w-80');
      const children = Array.from(drawer?.children || []);
      const titleIndex = children.findIndex(
        child => child.textContent === 'Title'
      );
      const contentIndex = children.findIndex(
        child => child.textContent === 'Content'
      );
      
      expect(titleIndex).toBeLessThan(contentIndex);
    });
  });
});