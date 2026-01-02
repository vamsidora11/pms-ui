import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
    });

    it('has correct data-slot attribute', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
    });

    it('applies base styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'bg-white',
        'text-gray-900',
        'flex',
        'flex-col',
        'gap-6',
        'rounded-xl',
        'border',
        'shadow-sm'
      );
    });

    it('merges custom className', () => {
      render(
        <Card data-testid="card" className="custom-class">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class', 'bg-white', 'rounded-xl');
    });

    it('spreads additional props', () => {
      render(
        <Card data-testid="card" id="my-card" aria-label="Test card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'my-card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    it('handles undefined className', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
    });
  });

  describe('CardHeader', () => {
    it('renders with children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header.tagName).toBe('DIV');
    });

    it('has correct data-slot attribute', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-slot',
        'card-header'
      );
    });

    it('applies base styles', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('grid', 'auto-rows-min', 'gap-1.5', 'px-6', 'pt-6');
    });

    it('merges custom className', () => {
      render(
        <CardHeader data-testid="header" className="custom-header">
          Content
        </CardHeader>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header', 'grid', 'px-6');
    });

    it('spreads additional props', () => {
      render(
        <CardHeader data-testid="header" role="banner">
          Content
        </CardHeader>
      );
      expect(screen.getByTestId('header')).toHaveAttribute('role', 'banner');
    });
  });

  describe('CardTitle', () => {
    it('renders with children', () => {
      render(<CardTitle>Title text</CardTitle>);
      expect(screen.getByText('Title text')).toBeInTheDocument();
    });

    it('renders as an h4 element', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title.tagName).toBe('H4');
    });

    it('has correct data-slot attribute', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveAttribute(
        'data-slot',
        'card-title'
      );
    });

    it('applies base styles', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none');
    });

    it('merges custom className', () => {
      render(
        <CardTitle data-testid="title" className="text-blue-600">
          Title
        </CardTitle>
      );
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-blue-600', 'text-lg', 'font-semibold');
    });

    it('spreads additional props', () => {
      render(
        <CardTitle data-testid="title" id="card-title">
          Title
        </CardTitle>
      );
      expect(screen.getByTestId('title')).toHaveAttribute('id', 'card-title');
    });
  });

  describe('CardDescription', () => {
    it('renders with children', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('renders as a p element', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc.tagName).toBe('P');
    });

    it('has correct data-slot attribute', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId('desc')).toHaveAttribute(
        'data-slot',
        'card-description'
      );
    });

    it('applies base styles', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-gray-500', 'text-sm');
    });

    it('merges custom className', () => {
      render(
        <CardDescription data-testid="desc" className="italic">
          Description
        </CardDescription>
      );
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('italic', 'text-gray-500', 'text-sm');
    });

    it('spreads additional props', () => {
      render(
        <CardDescription data-testid="desc" aria-live="polite">
          Description
        </CardDescription>
      );
      expect(screen.getByTestId('desc')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('CardContent', () => {
    it('renders with children', () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content.tagName).toBe('DIV');
    });

    it('has correct data-slot attribute', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content')).toHaveAttribute(
        'data-slot',
        'card-content'
      );
    });

    it('applies base styles', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('px-6');
    });

    it('merges custom className', () => {
      render(
        <CardContent data-testid="content" className="py-4">
          Content
        </CardContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('py-4', 'px-6');
    });

    it('spreads additional props', () => {
      render(
        <CardContent data-testid="content" role="main">
          Content
        </CardContent>
      );
      expect(screen.getByTestId('content')).toHaveAttribute('role', 'main');
    });
  });

  describe('CardFooter', () => {
    it('renders with children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer.tagName).toBe('DIV');
    });

    it('has correct data-slot attribute', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toHaveAttribute(
        'data-slot',
        'card-footer'
      );
    });

    it('applies base styles', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'px-6', 'pb-6');
    });

    it('merges custom className', () => {
      render(
        <CardFooter data-testid="footer" className="justify-end">
          Footer
        </CardFooter>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('justify-end', 'flex', 'items-center');
    });

    it('spreads additional props', () => {
      render(
        <CardFooter data-testid="footer" role="contentinfo">
          Footer
        </CardFooter>
      );
      expect(screen.getByTestId('footer')).toHaveAttribute(
        'role',
        'contentinfo'
      );
    });
  });

  describe('Complete Card composition', () => {
    it('renders all components together', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Main content here</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Main content here')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('maintains proper nesting structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');

      expect(card).toContainElement(header);
      expect(header).toContainElement(title);
    });

    it('all components have correct data-slot attributes', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
            <CardDescription data-testid="desc">Description</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-slot',
        'card-header'
      );
      expect(screen.getByTestId('title')).toHaveAttribute(
        'data-slot',
        'card-title'
      );
      expect(screen.getByTestId('desc')).toHaveAttribute(
        'data-slot',
        'card-description'
      );
      expect(screen.getByTestId('content')).toHaveAttribute(
        'data-slot',
        'card-content'
      );
      expect(screen.getByTestId('footer')).toHaveAttribute(
        'data-slot',
        'card-footer'
      );
    });
  });

  describe('mergeClasses utility', () => {
    it('filters out falsy values', () => {
      render(
        <Card data-testid="card" className={undefined}>
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card.className).not.toContain('undefined');
    });

    it('handles multiple classNames', () => {
      render(
        <Card data-testid="card" className="class1 class2 class3">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('class1', 'class2', 'class3');
    });
  });
});