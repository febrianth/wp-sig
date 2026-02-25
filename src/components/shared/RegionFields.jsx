import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Shared region fields (outside region checkbox, district select, village select)
 * used by both MemberForm and RegistrationForm.
 */
function RegionFields({
    isOutsideRegion,
    districtId,
    villageId,
    districts,
    filteredVillages,
    onOutsideRegionChange,
    onDistrictChange,
    onVillageChange,
}) {
    return (
        <>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is_outside_region"
                    checked={!!isOutsideRegion}
                    onCheckedChange={onOutsideRegionChange}
                />
                <Label htmlFor="is_outside_region" className="text-sm font-medium">
                    Saya berasal dari luar daerah
                </Label>
            </div>
            {!isOutsideRegion && (
                <>
                    <div className="space-y-1">
                        <Label>Kecamatan</Label>
                        <Select value={districtId} onValueChange={onDistrictChange}>
                            <SelectTrigger><SelectValue placeholder="Pilih Kecamatan..." /></SelectTrigger>
                            <SelectContent>
                                {districts.map(d => (
                                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Desa/Kelurahan</Label>
                        <Select value={villageId} onValueChange={onVillageChange} disabled={!districtId}>
                            <SelectTrigger><SelectValue placeholder="Pilih Desa..." /></SelectTrigger>
                            <SelectContent>
                                {filteredVillages.map(v => (
                                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}
        </>
    );
}

export default RegionFields;
