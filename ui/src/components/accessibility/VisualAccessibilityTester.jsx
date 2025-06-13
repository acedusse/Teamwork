import React, { useState, useEffect } from 'react';
import './VisualAccessibilityTester.css';

const VisualAccessibilityTester = () => {
  const [contrastResults, setContrastResults] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [colorPairs, setColorPairs] = useState([
    { foreground: '#1a1a1a', background: '#ffffff', label: 'Primary Text' },
    { foreground: '#4a4a4a', background: '#ffffff', label: 'Secondary Text' },
    { foreground: '#6b6b6b', background: '#ffffff', label: 'Muted Text' },
    { foreground: '#0056b3', background: '#ffffff', label: 'Primary Action' },
    { foreground: '#ffffff', background: '#0056b3', label: 'Primary Button' },
    { foreground: '#155724', background: '#d4edda', label: 'Success Message' },
    { foreground: '#721c24', background: '#f8d7da', label: 'Error Message' },
    { foreground: '#856404', background: '#fff3cd', label: 'Warning Message' },
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // WCAG contrast calculation functions
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const calculateLuminance = (rgb) => {
    const { r, g, b } = rgb;
    
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const calculateContrastRatio = (color1, color2) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    const lum1 = calculateLuminance(rgb1);
    const lum2 = calculateLuminance(rgb2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  const getContrastGrade = (ratio, isLargeText = false) => {
    const aaThreshold = isLargeText ? 3.0 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7.0;
    
    if (ratio >= aaaThreshold) return { grade: 'AAA', level: 'excellent' };
    if (ratio >= aaThreshold) return { grade: 'AA', level: 'good' };
    return { grade: 'Fail', level: 'fail' };
  };

  // Calculate contrast for all color pairs
  useEffect(() => {
    const results = colorPairs.map(pair => {
      const ratio = calculateContrastRatio(pair.foreground, pair.background);
      const normalGrade = getContrastGrade(ratio, false);
      const largeGrade = getContrastGrade(ratio, true);
      
      return {
        ...pair,
        ratio: Math.round(ratio * 100) / 100,
        normalText: normalGrade,
        largeText: largeGrade,
        passes: ratio >= 4.5
      };
    });
    
    setContrastResults(results);
  }, [colorPairs]);

  // Detect zoom level changes
  useEffect(() => {
    const handleResize = () => {
      const newZoom = Math.round(window.devicePixelRatio * 100) / 100;
      setZoomLevel(newZoom);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addCustomColorPair = () => {
    setColorPairs([...colorPairs, {
      foreground: '#000000',
      background: '#ffffff',
      label: 'Custom Color Pair'
    }]);
  };

  const updateColorPair = (index, field, value) => {
    const updated = [...colorPairs];
    updated[index][field] = value;
    setColorPairs(updated);
  };

  const removeColorPair = (index) => {
    const updated = colorPairs.filter((_, i) => i !== index);
    setColorPairs(updated);
  };

  const testZoomCompatibility = (targetZoom) => {
    // Simulate zoom by temporarily changing body zoom
    const originalZoom = document.body.style.zoom;
    document.body.style.zoom = targetZoom;
    
    // Check for horizontal scrolling
    const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
    
    // Check interactive element sizes
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    const tooSmallElements = Array.from(interactiveElements).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).length;
    
    // Reset zoom
    document.body.style.zoom = originalZoom;
    
    return {
      zoomLevel: targetZoom,
      hasHorizontalScroll,
      tooSmallElements,
      passes: !hasHorizontalScroll && tooSmallElements === 0
    };
  };

  const runFullAccessibilityTest = () => {
    const zoomTests = [1.25, 1.5, 2.0].map(testZoomCompatibility);
    const failedContrast = contrastResults.filter(r => !r.passes).length;
    
    return {
      contrastIssues: failedContrast,
      zoomIssues: zoomTests.filter(t => !t.passes).length,
      totalTests: contrastResults.length + zoomTests.length,
      overallPasses: failedContrast === 0 && zoomTests.every(t => t.passes)
    };
  };

  const exportReport = () => {
    const testResults = runFullAccessibilityTest();
    const report = {
      timestamp: new Date().toISOString(),
      summary: testResults,
      contrastResults,
      zoomLevel,
      recommendations: []
    };

    if (testResults.contrastIssues > 0) {
      report.recommendations.push('Fix color contrast issues to meet WCAG 2.1 AA standards');
    }
    if (testResults.zoomIssues > 0) {
      report.recommendations.push('Improve zoom compatibility for high zoom levels');
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="visual-accessibility-tester">
      <div className="tester-header">
        <h2>Visual Accessibility Tester</h2>
        <p>Test color contrast, zoom compatibility, and WCAG 2.1 AA compliance</p>
        
        <div className="tester-controls">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-secondary"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Testing
          </button>
          <button 
            onClick={exportReport}
            className="btn btn-primary"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="status-overview">
        <div className="status-card">
          <h3>Current Zoom Level</h3>
          <div className={`zoom-indicator ${zoomLevel >= 2.0 ? 'zoom-high' : zoomLevel >= 1.5 ? 'zoom-medium' : 'zoom-normal'}`}>
            {zoomLevel}x
          </div>
          <p className="zoom-help">
            {zoomLevel >= 2.0 ? 'Testing at WCAG required 200% zoom' : 
             zoomLevel >= 1.5 ? 'Approaching WCAG 200% zoom requirement' : 
             'Normal zoom level - try zooming to 200% to test'}
          </p>
        </div>

        <div className="status-card">
          <h3>Contrast Issues</h3>
          <div className={`issue-count ${contrastResults.filter(r => !r.passes).length === 0 ? 'success' : 'warning'}`}>
            {contrastResults.filter(r => !r.passes).length}
          </div>
          <p>of {contrastResults.length} color pairs failing</p>
        </div>

        <div className="status-card">
          <h3>Accessibility Preferences</h3>
          <div className="preference-indicators">
            <span className={`preference-indicator ${window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'active' : ''}`}>
              Reduced Motion
            </span>
            <span className={`preference-indicator ${window.matchMedia('(prefers-contrast: high)').matches ? 'active' : ''}`}>
              High Contrast
            </span>
          </div>
        </div>
      </div>

      {/* Color Contrast Testing */}
      <div className="contrast-testing">
        <h3>Color Contrast Analysis</h3>
        
        <div className="contrast-results">
          {contrastResults.map((result, index) => (
            <div key={index} className={`contrast-result ${result.passes ? 'pass' : 'fail'}`}>
              <div className="color-preview">
                <div 
                  className="color-sample"
                  style={{
                    backgroundColor: result.background,
                    color: result.foreground,
                    border: `1px solid ${result.foreground}`
                  }}
                >
                  Sample Text
                </div>
                <div className="color-codes">
                  <span>FG: {result.foreground}</span>
                  <span>BG: {result.background}</span>
                </div>
              </div>
              
              <div className="contrast-data">
                <div className="contrast-ratio">
                  <strong>{result.ratio}:1</strong>
                  <span className="ratio-label">Contrast Ratio</span>
                </div>
                
                <div className="compliance-grades">
                  <div className={`grade grade-${result.normalText.level}`}>
                    Normal: {result.normalText.grade}
                  </div>
                  <div className={`grade grade-${result.largeText.level}`}>
                    Large: {result.largeText.grade}
                  </div>
                </div>
                
                <div className="result-label">
                  {result.label}
                  {showAdvanced && (
                    <button 
                      onClick={() => removeColorPair(index)}
                      className="btn btn-sm btn-danger"
                      aria-label={`Remove ${result.label}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {showAdvanced && (
                <div className="color-editors">
                  <input 
                    type="color"
                    value={result.foreground}
                    onChange={(e) => updateColorPair(index, 'foreground', e.target.value)}
                    aria-label="Foreground color"
                  />
                  <input 
                    type="color"
                    value={result.background}
                    onChange={(e) => updateColorPair(index, 'background', e.target.value)}
                    aria-label="Background color"
                  />
                  <input 
                    type="text"
                    value={result.label}
                    onChange={(e) => updateColorPair(index, 'label', e.target.value)}
                    aria-label="Color pair label"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {showAdvanced && (
          <button 
            onClick={addCustomColorPair}
            className="btn btn-outline add-color-pair"
          >
            Add Custom Color Pair
          </button>
        )}
      </div>

      {/* Zoom Testing */}
      {showAdvanced && (
        <div className="zoom-testing">
          <h3>Zoom Compatibility Testing</h3>
          <div className="zoom-tests">
            {[1.25, 1.5, 2.0].map(zoom => {
              const testResult = testZoomCompatibility(zoom);
              return (
                <div key={zoom} className={`zoom-test ${testResult.passes ? 'pass' : 'fail'}`}>
                  <div className="zoom-level">{zoom}x Zoom</div>
                  <div className="zoom-issues">
                    {testResult.hasHorizontalScroll && <span className="issue">Horizontal scroll</span>}
                    {testResult.tooSmallElements > 0 && <span className="issue">{testResult.tooSmallElements} small elements</span>}
                    {testResult.passes && <span className="success">All tests pass</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WCAG Guidelines Reference */}
      <div className="wcag-reference">
        <h3>WCAG 2.1 AA Guidelines</h3>
        <div className="guideline-grid">
          <div className="guideline">
            <strong>Normal Text:</strong> 4.5:1 contrast ratio minimum
          </div>
          <div className="guideline">
            <strong>Large Text:</strong> 3:1 contrast ratio minimum (18pt+ or 14pt+ bold)
          </div>
          <div className="guideline">
            <strong>Zoom:</strong> Content must be usable at 200% zoom without horizontal scrolling
          </div>
          <div className="guideline">
            <strong>Touch Targets:</strong> Interactive elements should be at least 44x44 pixels
          </div>
          <div className="guideline">
            <strong>Color:</strong> Information should not be conveyed by color alone
          </div>
          <div className="guideline">
            <strong>Focus:</strong> All interactive elements must have visible focus indicators
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAccessibilityTester; 