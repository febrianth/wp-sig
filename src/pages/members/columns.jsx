"use client"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

export const generateColumns = ({ onEdit, onDelete, settings }) => [
    {
        accessorKey: "name",
        header: "Nama"
    },
    {
        accessorKey: "phone_number",
        header: "Nomor Telepon"
    },
    {
        id: 'wilayah',
        header: "Wilayah",
        cell: ({ row }) => {
            const member = row.original;
            const districtName = settings?.map_data?.districts?.[member.district_id]
                || <span className="text-destructive">[{member.district_id || 'N/A'}]</span>;
            const villageObject = settings?.map_data?.villages?.[member.village_id];
            const villageName = villageObject
                ? villageObject.name
                : <span className="text-destructive">[{member.village_id || 'N/A'}]</span>;
            return <span>{villageName}, {districtName}</span>;
        },
        enableSorting: false, // <-- Nonaktifkan sorting untuk kolom ini
    },
    {
        accessorKey: "full_address",
        header: "Alamat Lengkap"
    },
    {
        accessorKey: "event_count", // Ambil data 'badge' yang sudah kita proses
        header: "Peringkat",
        cell: ({ row }) => {
            // Tampilan (cell) tetap mengambil data 'badge' dari 'row.original'
            const badge = row.original.badge;
            if (!badge) return null;
            return <Badge variant={badge.variant}>{badge.text}</Badge>;
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const member = row.original;
            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(member)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(member)} className="text-destructive">Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        enableSorting: false, // <-- PERBAIKAN 2: Nonaktifkan sorting untuk kolom Aksi
    },
];