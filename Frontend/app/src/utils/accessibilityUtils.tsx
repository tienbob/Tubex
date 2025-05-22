import React, { KeyboardEvent } from 'react';

/**
 * Makes an element keyboard-accessible by triggering click on Enter/Space
 */
export const withKeyboardAccessibility = (
  callback: () => void,
  keys = ['Enter', ' ']
) => {
  return (e: KeyboardEvent) => {
    if (keys.includes(e.key)) {
      e.preventDefault();
      callback();
    }
  };
};

/**
 * Adds proper ARIA attributes to interactive elements
 */
export const getAriaProps = (
  role: string,
  label: string,
  expanded?: boolean,
  controls?: string,
  selected?: boolean
): Record<string, string | boolean | undefined> => {
  const props: Record<string, string | boolean | undefined> = {
    role,
    'aria-label': label,
  };
  
  if (expanded !== undefined) {
    props['aria-expanded'] = expanded;
  }
  
  if (controls) {
    props['aria-controls'] = controls;
  }
  
  if (selected !== undefined) {
    props['aria-selected'] = selected;
  }
  
  return props;
};

/**
 * Creates proper aria-live region for dynamic content
 */
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}> = ({ children, politeness = 'polite', atomic = false }) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}
    >
      {children}
    </div>
  );
};

/**
 * Creates a skip link for keyboard users to bypass navigation
 */
export const SkipLink: React.FC<{
  targetId: string;
  label?: string;
}> = ({ targetId, label = 'Skip to main content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        padding: '8px',
        backgroundColor: '#fff',
        zIndex: 1001,
        transition: 'top 0.2s',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      {label}
    </a>
  );
};

/**
 * Enhanced button with keyboard accessibility
 */
export const AccessibleButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}> = ({ onClick, children, label, className, style, disabled = false }) => {
  const handleKeyDown = withKeyboardAccessibility(onClick);
  
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : handleKeyDown}
      aria-label={label}
      className={className}
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style 
      }}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};

/**
 * Function to test color contrast ratio
 * Returns true if the contrast ratio meets WCAG AA standard (4.5:1)
 */
export function hasGoodContrast(foreground: string, background: string): boolean {
  // Convert hex to RGB
  const hexToRgb = (hex: string): number[] => {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Handle shorthand hex (e.g., #FFF)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Handle parsing errors
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.error(`Invalid hex color: ${hex}`);
      return [0, 0, 0];
    }
    
    return [r, g, b];
  };

  // Calculate relative luminance
  const luminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map(c => {
      const channel = c / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  try {
    const foregroundRgb = hexToRgb(foreground);
    const backgroundRgb = hexToRgb(background);
    
    const foregroundLuminance = luminance(foregroundRgb);
    const backgroundLuminance = luminance(backgroundRgb);
    
    // Calculate contrast ratio
    const contrastRatio = 
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    
    // WCAG AA requires 4.5:1 for normal text
    return contrastRatio >= 4.5;
  } catch (error) {
    console.error('Error calculating contrast ratio:', error);
    return false;
  }
}
