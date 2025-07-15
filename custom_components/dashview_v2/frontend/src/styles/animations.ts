/**
 * Animation constants and utilities for Dashview V2 widgets.
 * Provides consistent timing, easing, and keyframe animations.
 */

import { css } from 'lit';

export const ANIMATION_DURATION = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms'
};

export const EASING = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
};

/**
 * Skeleton loading animation styles
 */
export const skeletonStyles = css`
  @keyframes skeleton-loading {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--card-background-color) 0%,
      var(--divider-color) 50%,
      var(--card-background-color) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 4px;
  }
  
  .skeleton-text {
    height: 16px;
    margin: 4px 0;
  }
  
  .skeleton-text.large {
    height: 20px;
  }
  
  .skeleton-text.small {
    height: 12px;
  }
  
  .skeleton-button {
    height: 36px;
    width: 100px;
  }
  
  .skeleton-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  
  .skeleton-card {
    height: 120px;
    width: 100%;
    border-radius: 8px;
  }
`;

/**
 * Smooth expand/collapse animation styles
 */
export const expandCollapseStyles = css`
  @keyframes expand {
    from {
      max-height: 0;
      opacity: 0;
    }
    to {
      max-height: 600px;
      opacity: 1;
    }
  }
  
  @keyframes collapse {
    from {
      max-height: 600px;
      opacity: 1;
    }
    to {
      max-height: 0;
      opacity: 0;
    }
  }
  
  .expand-enter {
    animation: expand 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
    overflow: hidden;
  }
  
  .collapse-exit {
    animation: collapse 250ms cubic-bezier(0.4, 0.0, 1, 1);
    overflow: hidden;
  }
  
  .content-expandable {
    overflow: hidden;
    transition: max-height 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
  }
  
  .content-collapsed {
    max-height: 0;
  }
  
  .content-expanded {
    max-height: 600px;
  }
`;

/**
 * Touch interaction animations
 */
export const touchStyles = css`
  @keyframes touch-feedback {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  
  .touch-target {
    min-height: 44px;
    min-width: 44px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  .touch-target:active {
    animation: touch-feedback 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  .touch-target:hover {
    background: var(--secondary-background-color);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .touch-target:active {
      animation: none;
      transform: scale(0.98);
    }
  }
`;

/**
 * Loading spinner animation
 */
export const spinnerStyles = css`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  .loading-dots {
    display: inline-flex;
    gap: 4px;
  }
  
  .loading-dots::after {
    content: '';
    animation: loading-dots 1.5s ease-in-out infinite;
  }
  
  @keyframes loading-dots {
    0%, 20% { content: ''; }
    40% { content: '.'; }
    60% { content: '..'; }
    80%, 100% { content: '...'; }
  }
`;

/**
 * Fade in/out animations
 */
export const fadeStyles = css`
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .fade-in {
    animation: fade-in 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
  }
  
  .fade-out {
    animation: fade-out 250ms cubic-bezier(0.4, 0.0, 1, 1);
  }
  
  .fade-transition {
    transition: opacity 250ms cubic-bezier(0.4, 0.0, 0.2, 1);
  }
`;

/**
 * Slide animations for mobile interactions
 */
export const slideStyles = css`
  @keyframes slide-in-right {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slide-in-left {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slide-out-right {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
  }
  
  @keyframes slide-out-left {
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
  }
  
  .slide-in-right {
    animation: slide-in-right 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
  }
  
  .slide-in-left {
    animation: slide-in-left 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
  }
  
  .slide-out-right {
    animation: slide-out-right 250ms cubic-bezier(0.4, 0.0, 1, 1);
  }
  
  .slide-out-left {
    animation: slide-out-left 250ms cubic-bezier(0.4, 0.0, 1, 1);
  }
`;

/**
 * Combined animation styles for easy import
 */
export const animationStyles = css`
  ${skeletonStyles}
  ${expandCollapseStyles}
  ${touchStyles}
  ${spinnerStyles}
  ${fadeStyles}
  ${slideStyles}
  
  /* Respect user's motion preferences */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;