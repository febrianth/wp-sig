import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cn } from "../../lib/utils";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Badge } from "../../components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";

function MultiSelectCombobox({ options, selected, onChange, placeholder }) {
    const [open, setOpen] = useState(false);

    const handleToggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter(id => id !== value)); // Hapus
        } else {
            onChange([...selected, value]); // Tambah
        }
    };

    const selectedLabels = selected.map(id => options.find(opt => opt.value === id)?.label);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10 py-2 flex-wrap">
                    <div className="flex gap-1 flex-wrap">
                        {selectedLabels.length > 0 ? (
                            selectedLabels.map(label => <Badge key={label} variant="secondary">{label}</Badge>)
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Cari event..." />
                    <CommandList>
                        <CommandEmpty>Event tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem key={opt.value} value={opt.label} onSelect={() => handleToggle(opt.value)}>
                                    <Check className={cn("mr-2 h-4 w-4", selected.includes(opt.value) ? "opacity-100" : "opacity-0")} />
                                    {opt.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function MemberForm({ initialData, settings, onSave, onCancel, allEvents }) {
    const [formData, setFormData] = useState(initialData || {
        name: "",
        full_address: "",
        phone_number: "",
        district_id: "",
        village_id: "",
        event_ids: []
    });

    const handleChange = (e) => {
        const { id, value } = e.target;

        if (id === 'phone_number') {
            const sanitizedValue = value.replace(/[^0-9+]/g, '');
            setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSelectChange = (id, value) => {
        if (id === "district_id") {
            // Jika kecamatan berubah, reset pilihan desa
            setFormData(prev => ({ ...prev, district_id: value, village_id: "" }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleEventsChange = (eventIds) => {
        setFormData(prev => ({ ...prev, event_ids: eventIds }));
    };

    const eventOptions = Object.values(allEvents).map(event => ({ value: event.id, label: event.event_name }));
    // Siapkan data untuk options dari "kamus data" di settings
    const districts = settings?.map_data?.districts
        ? Object.entries(settings.map_data.districts).map(([id, name]) => ({
            value: id,
            label: name,
        }))
        : [];

    const villages = settings?.map_data?.villages
        ? Object.entries(settings.map_data.villages).map(([id, villageObj]) => ({
            value: id,
            label: villageObj.name,
            districtId: villageObj.parent_district,
        }))
        : [];

    // Filter desa berdasarkan ID kecamatan yang DIPILIH di form
    const filteredVillages = formData.district_id
        ? villages.filter((v) => v.districtId === formData.district_id)
        : [];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="phone_number">Nomor Telepon</Label>
                <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number || ''}
                    placeholder="ex : +628123456789"
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="full_address">Alamat Lengkap</Label>
                <Textarea
                    id="full_address"
                    value={formData.full_address || ''}
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="district_id">Kecamatan</Label>
                <Select
                    value={formData.district_id}
                    onValueChange={(value) => handleSelectChange('district_id', value)}
                >
                    <SelectTrigger id="district_id">
                        <SelectValue placeholder="Pilih Kecamatan..." />
                    </SelectTrigger>
                    <SelectContent>
                        {districts.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                                {d.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label htmlFor="village_id">Desa/Kelurahan</Label>
                <Select
                    value={formData.village_id}
                    onValueChange={(value) => handleSelectChange('village_id', value)}
                    disabled={!formData.district_id}
                >
                    <SelectTrigger id="village_id">
                        <SelectValue placeholder="Pilih Desa..." />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredVillages.map((v) => (
                            <SelectItem key={v.value} value={v.value}>
                                {v.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label>Event yang Diikuti</Label>
                <MultiSelectCombobox
                    options={eventOptions}
                    selected={formData.event_ids}
                    onChange={handleEventsChange}
                    placeholder="Pilih event..."
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Batal
                </Button>
                <Button type="submit">Simpan</Button>
            </div>
        </form>
    );
}

export default MemberForm;
