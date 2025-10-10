"use client"
import React from "react"
import { flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '../../components/ui/pagination'

export function DataTable({ columns, data }) {
	const [filtering, setFiltering] = React.useState('')

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: { globalFilter: filtering },
		onGlobalFilterChange: setFiltering,
		initialState: { 
			pagination: { 
				pageSize: 10 // Menampilkan baris per halaman
			} 
		} 
	})

	// --- NOMOR HALAMAN DINAMIS ---
	const currentPage = table.getState().pagination.pageIndex + 1;
	const pageCount = table.getPageCount();
	const pageNumbers = [];
	for (let i = Math.max(1, currentPage - 1); i <= Math.min(pageCount, currentPage + 1); i++) {
		pageNumbers.push(i);
	}

	return (
		<div>
			<div className="flex items-center py-4">
				<Input
					placeholder="Cari semua kolom..."
					value={filtering}
					onChange={(event) => setFiltering(event.target.value)}
					className="max-w-sm"
				/>
			</div>
			<div className="rounded-md border-2 border-foreground ">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									Tidak ada data.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* === BAGIAN PAGINATION === */}
			<div className="flex items-center justify-between space-x-2 py-4">
				<div className="text-sm text-muted-foreground">
					Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
				</div>
				<Pagination className="mx-0 w-fit">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
								className={!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
							/>
						</PaginationItem>

						{pageNumbers.map(page => (
							<PaginationItem key={page}>
								<PaginationLink
									onClick={() => table.setPageIndex(page - 1)}
									isActive={currentPage === page}
									className="cursor-pointer"
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						))}

						<PaginationItem>
							<PaginationNext
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
								className={!table.getCanNextPage() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	)
}