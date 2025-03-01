import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * Renders pagination controls to navigate between pages.
 *
 * When multiple pages are available, the component displays "Previous" and "Next" buttons along with the current page indicator ("Page X of Y"). The component returns null if there is only one page. The "Previous" button is disabled on the first page, and the "Next" button is disabled on the last page.
 *
 * @param currentPage - The current active page number.
 * @param totalPages - The total number of pages.
 * @param onPageChange - Callback invoked with the new page number when the page changes.
 */
export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex justify-center space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm bg-gray-100 rounded-md disabled:opacity-50 dark:bg-gray-700"
      >
        Previous
      </button>
      <span className="px-3 py-1 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm bg-gray-100 rounded-md disabled:opacity-50 dark:bg-gray-700"
      >
        Next
      </button>
    </div>
  )
}
