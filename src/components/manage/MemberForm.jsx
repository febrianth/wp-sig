import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cn } from "../../lib/utils";

// Komponen Select manual yang diberi gaya Tailwind & Neobrutalism
function SelectManual({ id, value, onChange, disabled, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-none border-2 border-foreground bg-background px-3 py-2 text-sm shadow-neo-sm",
        "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      {children}
    </select>
  );
}

function MemberForm({ initialData, settings, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    full_address: "",
    district_id: "",
    village_id: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    // Jika yang berubah adalah kecamatan, reset pilihan desa
    if (id === "district_id") {
      setFormData({ ...formData, district_id: value, village_id: "" });
    } else {
      setFormData({ ...formData, [id]: value });
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
      {/* ... (Tambahkan input lain untuk full_address, latitude, longitude di sini jika perlu) ... */}

      <div className="space-y-1">
        <Label htmlFor="district_id">Kecamatan</Label>
        <SelectManual
          id="district_id"
          value={formData.district_id}
          onChange={handleChange}
        >
          <option value="">Pilih Kecamatan...</option>
          {districts.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </SelectManual>
      </div>

      <div className="space-y-1">
        <Label htmlFor="village_id">Desa/Kelurahan</Label>
        <SelectManual
          id="village_id"
          value={formData.village_id}
          onChange={handleChange}
          disabled={!formData.district_id}
        >
          <option value="">Pilih Desa...</option>
          {filteredVillages.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </SelectManual>
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
