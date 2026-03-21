import { memo, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import * as strings from './strings';

export interface GenericTableColumn<RowType> {
	id: string;
	header: ReactNode;
	renderCell: (row: RowType, rowIndex: number) => ReactNode;
	headerClassName?: string;
	cellClassName?: string;
}

export interface GenericTableProps<RowType> {
	columns: GenericTableColumn<RowType>[];
	rows: RowType[];
	getRowKey: (row: RowType, rowIndex: number) => string;
	isLoading?: boolean;
	loadingContent?: ReactNode;
	emptyContent?: ReactNode;
	containerClassName?: string;
	tableClassName?: string;
	headClassName?: string;
	bodyClassName?: string;
	loadingRowClassName?: string;
	emptyRowClassName?: string;
}

interface TableHeaderCellProps {
	className?: string;
	children: ReactNode;
}

const TableHeaderCell = memo(function TableHeaderCell({ className, children }: TableHeaderCellProps) {
	return <th className={cn('ui-table-header-cell', className)}>{children}</th>;
});

interface TableBodyCellProps {
	className?: string;
	children: ReactNode;
}

const TableBodyCell = memo(function TableBodyCell({ className, children }: TableBodyCellProps) {
	return <td className={cn('ui-table-cell', className)}>{children}</td>;
});

interface MessageRowProps {
	colSpan: number;
	className?: string;
	children: ReactNode;
}

const MessageRow = memo(function MessageRow({ colSpan, className, children }: MessageRowProps) {
	return (
		<tr>
			<td colSpan={colSpan} className={cn('ui-table-cell-message', className)}>
				{children}
			</td>
		</tr>
	);
});

function GenericTableInner<RowType>({
	columns,
	rows,
	getRowKey,
	isLoading = false,
	loadingContent = strings.defaultLoadingMessage,
	emptyContent = strings.defaultEmptyMessage,
	containerClassName,
	tableClassName,
	headClassName,
	bodyClassName,
	loadingRowClassName,
	emptyRowClassName,
}: GenericTableProps<RowType>) {
	const mergedContainerClassName = cn('ui-table-container', containerClassName);
	const mergedTableClassName = cn('ui-table', tableClassName);
	const mergedHeadClassName = cn('ui-table-head', headClassName);
	const mergedBodyClassName = cn('ui-table-body', bodyClassName);
	const mergedLoadingRowClassName = cn('ui-table-cell-message', loadingRowClassName);
	const mergedEmptyRowClassName = cn('ui-table-cell-message', emptyRowClassName);

	return (
		<div className={mergedContainerClassName}>
			<div className={cn('max-h-[34rem] overflow-x-auto overflow-y-auto lg:overflow-x-visible')}>
				<table className={cn(mergedTableClassName, 'min-w-[640px] lg:min-w-full')}>
					<thead className={mergedHeadClassName}>
						<tr>
							{columns.map(column => (
								<TableHeaderCell key={column.id} className={column.headerClassName}>
									{column.header}
								</TableHeaderCell>
							))}
						</tr>
					</thead>
					<tbody className={mergedBodyClassName}>
						{isLoading ? (
							<MessageRow colSpan={columns.length} className={mergedLoadingRowClassName}>
								{loadingContent}
							</MessageRow>
						) : rows.length === 0 ? (
							<MessageRow colSpan={columns.length} className={mergedEmptyRowClassName}>
								{emptyContent}
							</MessageRow>
						) : (
							rows.map((row, rowIndex) => (
								<tr key={getRowKey(row, rowIndex)}>
									{columns.map(column => (
										<TableBodyCell key={column.id} className={column.cellClassName}>
											{column.renderCell(row, rowIndex)}
										</TableBodyCell>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

const GenericTable = memo(GenericTableInner) as typeof GenericTableInner;

export default GenericTable;
