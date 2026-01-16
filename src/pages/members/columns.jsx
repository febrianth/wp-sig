"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

// Helper function untuk menentukan Badge
const getBadgeProps = (count, badgeCount) => {
    // Pastikan count menjadi number
    const num = Number(count || 0);

    if (num >= badgeCount.gold) return { label: 'Gold', className: 'bg-yellow-500 hover:bg-yellow-600' };
    if (num >= badgeCount.silver) return { label: 'Silver', className: 'bg-gray-400 hover:bg-gray-500' };
    if (num >= badgeCount.bronze) return { label: 'Bronze', className: 'bg-amber-700 hover:bg-amber-800' };

    return { label: 'New', className: 'bg-slate-200 text-slate-700 hover:bg-slate-300' };
};

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
    },
    {
        accessorKey: "full_address",
        header: "Alamat Lengkap"
    },
    {
        accessorKey: "event_count",
        header: "Peringkat",
        cell: ({ row }) => {
            // Ambil data dari backend
            const count = row.getValue("event_count");
            const { label, className } = getBadgeProps(count, settings.badge_thresholds);

            return (
                <div className="flex flex-col items-start gap-1">
                    {/* Tampilkan Badge */}
                    <Badge className={`${className} border-none`}>
                        {label}
                    </Badge>
                    {/* Tampilkan detail angka kecil di bawahnya */}
                    <span className="text-[10px] text-muted-foreground">
                        {count} Event diikuti
                    </span>
                </div>
            );
        },
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
    },
];