import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cn } from "../../lib/utils";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

function MemberForm({ initialData, settings, onSave, onCancel }) {
	const [formData, setFormData] = useState(initialData || {
		name: "",
		full_address: "",
		phone_number: "",
		district_id: "",
		village_id: "",
		latitude: "",
		longitude: "",
	});

	const handleChange = (e) => {
		const { id, value } = e.target;

		if (id === 'phone_number') {
			// Hanya izinkan angka dan karakter '+' di awal
			const sanitizedValue = value.replace(/[^0-9+]/g, '');
			setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
			return; // Hentikan fungsi di sini
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
					max
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
