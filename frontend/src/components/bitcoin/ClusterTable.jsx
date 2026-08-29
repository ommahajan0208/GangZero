import { useMemo } from 'react';
import DataTable from '../common/DataTable';
import RiskBadge from '../common/RiskBadge';
import { formatPercent, formatTimeRange } from '../../utils/formatters';
import { getRiskLevel } from '../../constants/riskLevels';
import { ChevronRight } from 'lucide-react';

export default function ClusterTable({ clusters = [], onSelect }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'cluster_id',
        header: 'Cluster ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-[13px] font-medium text-gray-800">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'node_count',
        header: 'Nodes',
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'illicit_count',
        header: 'Illicit',
        cell: ({ getValue }) => (
          <span className="text-red-600 font-semibold">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'avg_risk_score',
        header: 'Avg Risk',
        cell: ({ getValue }) => {
          const score = getValue();
          const level = getRiskLevel(score);
          return <RiskBadge level={level} size="sm" />;
        },
      },
      {
        id: 'time_range',
        header: 'Time Range',
        accessorFn: (row) => row.time_step_min,
        cell: ({ row }) =>
          formatTimeRange(row.original.time_step_min, row.original.time_step_max),
      },
      {
        id: 'actions',
        header: '',
        cell: () => <ChevronRight className="w-4 h-4 text-gray-400" />,
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={clusters}
      onRowClick={onSelect}
      emptyMessage="No clusters match your filter — try lowering the risk threshold"
    />
  );
}
