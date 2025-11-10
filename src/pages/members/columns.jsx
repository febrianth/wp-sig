"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye } from "lucide-react"

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
            if (member.is_outside_region == 1) {
                return <span className="text-muted-foreground italic">Dari Luar Daerah</span>;
            }
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
        accessorKey: "event_count",
        header: "Peringkat",
        cell: ({ row }) => {
            const badge = row.original.badge;
            if (!badge) return null;
            return <Badge className={badge.classname}>{badge.text}</Badge>;
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
                            <DropdownMenuItem>
                                <Link to={`/member/${member.id}`}>
                                    Lihat Detail
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(member)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(member)} className="text-destructive">Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        enableSorting: false,
    },
];