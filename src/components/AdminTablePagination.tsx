import type { AdminPageSize } from '../lib/api'

const pageSizes: AdminPageSize[] = [10, 30, 50, 100, 300, 500, 'all']

type Props = {
  totalItems: number
  currentPage: number
  pageSize: AdminPageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (size: AdminPageSize) => void
}

export function AdminTablePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const rowsPerPage = pageSize === 'all' ? totalItems : pageSize
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const lastItem = Math.min(currentPage * rowsPerPage, totalItems)

  return (
    <div className="admin-pagination">
      <span>Showing {firstItem}–{lastItem} of {totalItems}</span>
      <label>
        Rows per table
        <select
          value={pageSize}
          onChange={(event) => {
            const value = pageSizes.find((size) => String(size) === event.target.value) ?? 10
            onPageSizeChange(value)
          }}
        >
          {pageSizes.map((size) => <option value={size} key={size}>{size === 'all' ? 'All' : size}</option>)}
        </select>
      </label>
      <div>
        <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Previous</button>
        <span>Page {currentPage} of {pageCount}</span>
        <button type="button" disabled={currentPage >= pageCount} onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    </div>
  )
}

