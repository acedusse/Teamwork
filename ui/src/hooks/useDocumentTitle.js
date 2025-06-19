import { useEffect } from 'react';

/**
 * Custom hook to set the document title
 * @param {string} title - The title to set for the document
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    // Cleanup function to restore previous title
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle; 