"use client"
import React from "react"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, Inbox } from "lucide-react"

export function DataTable({ columns, data, meta, onPageChange, loading }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Beritahu table kalau pagination di-handle server
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card relative overflow-hidden">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-primary">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm font-medium">Memuat data...</span>
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="font-semibold text-foreground">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              !loading && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Inbox className="h-10 w-10 mb-2 opacity-50" />
                      <p>Tidak ada data ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {meta.total_items > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Hal <strong>{meta.current_page}</strong> dari <strong>{meta.last_page}</strong> 
            <span className="ml-1 hidden sm:inline">({meta.total_items} total data)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
              disabled={meta.current_page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
              disabled={meta.current_page >= meta.last_page || loading}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}