import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import RegionFields from "@/components/shared/RegionFields";
import { useRegionFields, sanitizePhoneNumber } from "@/hooks/use-region-fields";

function MultiSelectCombobox({ options, selected, onChange, placeholder }) {
    const [open, setOpen] = useState(false);

    const handleToggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter((id) => id !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const selectedLabels = selected.map(
        (id) => options.find((opt) => opt.value === id)?.label
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-10 py-2 flex-wrap"
                >
                    <div className="flex gap-1 flex-wrap">
                        {selectedLabels.length > 0 ? (
                            selectedLabels.map((label) => (
                                <Badge key={label} variant="secondary">
                                    {label}
                                </Badge>
                            ))
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
                                <CommandItem
                                    key={opt.value}
                                    value={opt.label}
                                    onSelect={() => handleToggle(opt.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(opt.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
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
    const [formData, setFormData] = useState({
        name: "",
        full_address: "",
        phone_number: "",
        district_id: "",
        village_id: "",
        is_outside_region: 0,
        event_ids: [],
    });

    const { districts, filteredVillages } = useRegionFields(
        settings?.map_data,
        formData.district_id
    );

    useEffect(() => {
        if (!initialData) return;

        setFormData(prev => ({
            ...prev,
            ...initialData,
            district_id: initialData.district_id ?? "",
            is_outside_region: Number(initialData.is_outside_region) || 0,
            event_ids: initialData.event_ids || [],
            village_id: initialData.village_id ?? "",
        }));
    }, [initialData]);

    const handleOutsideRegionChange = (checked) => {
        const newValue = checked ? 1 : 0;
        setFormData((prev) => ({
            ...prev,
            is_outside_region: newValue,
            district_id: newValue ? "" : prev.district_id,
            village_id: newValue ? "" : prev.village_id,
        }));
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: id === "phone_number" ? sanitizePhoneNumber(value) : value,
        }));
    };

    const handleDistrictChange = (value) => {
        setFormData((prev) => ({ ...prev, district_id: value, village_id: "" }));
    };

    const handleVillageChange = (value) => {
        setFormData((prev) => ({ ...prev, village_id: value }));
    };

    const handleEventsChange = (eventIds) => {
        setFormData((prev) => ({ ...prev, event_ids: eventIds }));
    };

    const eventOptions = Object.values(allEvents).map((event) => ({
        value: event.id,
        label: event.event_name,
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-1">
                <Label htmlFor="phone_number">Nomor Telepon</Label>
                <Input
                    id="phone_number"
                    type="tel"
                    placeholder="ex: +628123456789"
                    value={formData.phone_number}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-1">
                <Label htmlFor="full_address">Alamat Lengkap</Label>
                <Textarea
                    id="full_address"
                    value={formData.full_address}
                    onChange={handleChange}
                />
            </div>

            <RegionFields
                isOutsideRegion={formData.is_outside_region}
                districtId={formData.district_id}
                villageId={formData.village_id}
                districts={districts}
                filteredVillages={filteredVillages}
                onOutsideRegionChange={handleOutsideRegionChange}
                onDistrictChange={handleDistrictChange}
                onVillageChange={handleVillageChange}
            />

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
