import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Spinner from '../Spinner/Spinner';
import './KpiCard.css';

const KpiCard = ({
  label,
  value,
  trend = null,
  icon = null,
  variant = 'default',
  size = 'md',
  onClick = null,
  loading = false,
  className = ''
}) => {
  const classes = [
    'kpi-card',
    `kpi-card-${variant}`,
    `kpi-card-${size}`,
    onClick && 'kpi-card-clickable',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={classes}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className={classes} onClick={onClick}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      {trend !== null && trend !== undefined && (
        <div className={`kpi-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
