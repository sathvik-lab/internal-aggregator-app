/**
 * Color Scheme for Compliance/Business App
 * 
 * Professional color palette designed for a compliance document management system.
 * Colors are chosen to convey trust, professionalism, and clarity.
 */

export const COLORS = {
  // Primary brand colors
  primary: '#1B365D',        // Deep Navy - Professionalism, trust, stability
  primaryDark: '#0F2439',    // Darker navy for headers and emphasis
  primaryLight: '#2C5282',   // Lighter navy for hover states
  
  // Secondary colors
  secondary: '#4A5568',      // Slate Grey - Neutral, professional
  secondaryLight: '#718096', // Lighter grey for secondary actions
  
  // Accent colors
  accent: '#007AFF',         // Trust Blue - Call-to-action, links
  accentLight: '#5AC8FA',    // Light blue for highlights
  
  // Background colors
  background: '#F7FAFC',     // Light Grey/White - Main background
  backgroundSecondary: '#EDF2F7', // Slightly darker for card backgrounds
  surface: '#FFFFFF',        // White for cards and surfaces
  
  // Status colors
  success: '#38A169',        // Compliance Green - Success states, completed items
  successLight: '#68D391',   // Light green for success backgrounds
  warning: '#D69E2E',        // Warning Yellow - At-risk states
  warningLight: '#F6E05E',   // Light yellow for warning backgrounds
  error: '#E53E3E',          // Alert Red - Errors, critical issues
  errorLight: '#FC8181',     // Light red for error backgrounds
  info: '#3182CE',           // Info Blue - Informational messages
  
  // Text colors
  text: '#2D3748',           // Dark Charcoal - Primary text
  textSecondary: '#4A5568',  // Secondary text
  textLight: '#718096',      // Light text for hints and placeholders
  textInverse: '#FFFFFF',    // White text for dark backgrounds
  
  // Border and divider colors
  border: '#E2E8F0',         // Light border color
  borderDark: '#CBD5E0',     // Darker border for emphasis
  divider: '#E2E8F0',        // Divider lines
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)', // Dark overlay for modals
  overlayLight: 'rgba(0, 0, 0, 0.1)', // Light overlay
  
  // Compliance status colors (specific to compliance app)
  compliant: '#38A169',      // Green - Fully compliant
  atRisk: '#D69E2E',         // Yellow - At risk
  nonCompliant: '#E53E3E',   // Red - Non-compliant
  pending: '#718096',        // Grey - Pending review
};

// Export default for convenience
export default COLORS;
