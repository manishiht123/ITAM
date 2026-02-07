import React from 'react';
import Spinner from '../Spinner/Spinner';
import './Table.css';

const Table = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No data available',
  hoverable = true,
  striped = false,
  compact = false,
  className = ''
}) => {
  const classes = [
    'table-container',
    hoverable && 'table-hoverable',
    striped && 'table-striped',
    compact && 'table-compact',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="table-loading">
        <Spinner size="lg" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={classes}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, idx) => (
              <th key={idx} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((column, colIdx) => (
                <td key={colIdx} className={column.className}>
                  {column.render
                    ? column.render(row[column.key], row, rowIdx)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
