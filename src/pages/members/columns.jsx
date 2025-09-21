"use client"

import { Button } from "../../components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

// 'accessorKey' harus sama dengan nama field dari JSON yang dikirim oleh API Anda
export const columns = [
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "full_address",
    header: "Alamat",
  },
  {
    accessorKey: "regency_id", // Kita akan tampilkan ID Kabupaten
    header: "ID Kabupaten",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="text-right">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Buka menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Hapus</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]