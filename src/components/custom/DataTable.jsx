"use client"
import React from "react"
import { flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"

export function DataTable({ columns, data }) {
  const [filtering, setFiltering] = React.useState('')
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter: filtering },
    onGlobalFilterChange: setFiltering
  })

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
      <div className="rounded-md border-2 border-foreground shadow-neo">
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  )
}