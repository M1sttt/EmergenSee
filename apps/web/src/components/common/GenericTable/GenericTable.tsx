import { memo, ReactNode } from 'react';
import * as consts from './consts';
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
	const mergedContainerClassName = [consts.containerClass, containerClassName].filter(Boolean).join(' ');
	const mergedTableClassName = [consts.tableClass, tableClassName].filter(Boolean).join(' ');
	const mergedHeadClassName = [consts.headClass, headClassName].filter(Boolean).join(' ');
	const mergedBodyClassName = [consts.bodyClass, bodyClassName].filter(Boolean).join(' ');
	const mergedLoadingRowClassName = [consts.centeredMessageCellClass, loadingRowClassName]
		.filter(Boolean)
		.join(' ');
	const mergedEmptyRowClassName = [consts.centeredMessageCellClass, emptyRowClassName]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={mergedContainerClassName}>
			<table className={mergedTableClassName}>
				<thead className={mergedHeadClassName}>
					<tr>
						{columns.map(column => (
							<th key={column.id} className={[consts.headerCellClass, column.headerClassName].filter(Boolean).join(' ')}>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className={mergedBodyClassName}>
					{isLoading ? (
						<tr>
							<td colSpan={columns.length} className={mergedLoadingRowClassName}>
								{loadingContent}
							</td>
						</tr>
					) : rows.length === 0 ? (
						<tr>
							<td colSpan={columns.length} className={mergedEmptyRowClassName}>
								{emptyContent}
							</td>
						</tr>
					) : (
						rows.map((row, rowIndex) => (
							<tr key={getRowKey(row, rowIndex)}>
								{columns.map(column => (
									<td key={column.id} className={[consts.bodyCellClass, column.cellClassName].filter(Boolean).join(' ')}>
										{column.renderCell(row, rowIndex)}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

const GenericTable = memo(GenericTableInner) as typeof GenericTableInner;

export default GenericTable;