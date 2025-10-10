import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DataTable } from "../components/custom/DataTable";
import { generateColumns } from "./members/columns";
import { Button } from "../components/ui/button";
import { PlusCircle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../components/ui/alert-dialog";
import MemberForm from "../components/manage/MemberForm";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../components/ui/tooltip";
import { useToast } from "../hooks/use-toast";

function Manage() {
	const [data, setData] = useState([]);
	const [settings, setSettings] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingMember, setEditingMember] = useState(null);
	const [deletingMember, setDeletingMember] = useState(null);
	const { toast } = useToast();

	const fetchData = useCallback(async () => {
		if (data.length === 0) {
			setLoading(true);
		}
		console.log("Memulai fetchData...");
		try {
			const [membersRes, settingsRes] = await Promise.all([
				fetch(sig_plugin_data.api_url + "members", {
					headers: { "X-WP-Nonce": sig_plugin_data.nonce },
				}),
				fetch(sig_plugin_data.api_url + "settings", {
					headers: { "X-WP-Nonce": sig_plugin_data.nonce },
				}),
			]);
			if (!membersRes.ok || !settingsRes.ok)
				throw new Error("Gagal mengambil data dari server.");

			const membersData = await membersRes.json();
			const settingsData = await settingsRes.json();
			setData(membersData);
			setSettings(settingsData);
			console.log("FetchData berhasil:", { membersData, settingsData });
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Gagal mengambil data",
				description: error,
			});
			console.error("Gagal mengambil data:", error);
		}
		setLoading(false);
	}, []); // Array dependensi kosong, fungsi ini stabil

	// Panggil fetchData hanya sekali saat komponen pertama kali dimuat
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleSave = async (formData) => {
		const isEditing = !!formData.id;
		const url = isEditing
			? `${sig_plugin_data.api_url}members/${formData.id}`
			: `${sig_plugin_data.api_url}members`;
		const method = isEditing ? "PUT" : "POST";

		try {
			const response = await fetch(url, {
				method,
				headers: {
					"X-WP-Nonce": sig_plugin_data.nonce,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});
			if (!response.ok) throw new Error("Gagal menyimpan data.");

			toast({
				title: "Sukses!",
				description: isEditing ? `Data member "${formData.name}" telah berhasil diperbarui.` : `Data member "${formData.name}" telah berhasil disimpan.`,
			});
			setIsDialogOpen(false);
			setEditingMember(null);
			await fetchData(); // Panggil fungsi fetchData yang sudah stabil
		} catch (error) {
			toast({
				variant: "destructive",
				title: isEditing ? "Gagal Memperbarui" : "Gagal Menyimpan",
				description: error,
			});
			console.error("Error saving data:", error);
		}
	};

	const handleDelete = async () => {
		if (!deletingMember) return;
		try {
			const response = await fetch(
				`${sig_plugin_data.api_url}members/${deletingMember.id}`,
				{
					method: "DELETE",
					headers: { "X-WP-Nonce": sig_plugin_data.nonce },
				}
			);
			if (!response.ok) throw new Error("Gagal menghapus data.");

			toast({
				title: "Sukses!",
				description: `Data member "${deletingMember.name}" telah berhasil dihapus.`,
			});
			setDeletingMember(null);
			await fetchData(); // Panggil fungsi fetchData yang sudah stabil
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Gagal hapus data",
				description: error,
			});
			console.error("Error deleting data:", error);
		}
	};

	const columns = useMemo(
		() =>
			generateColumns({
				onEdit: (member) => {
					setEditingMember(member);
					setIsDialogOpen(true);
				},
				onDelete: (member) => setDeletingMember(member),
				settings: settings,
			}),
		[settings]
	);

	const isWilayahDataReady =
		settings?.map_data?.districts && settings?.map_data?.villages;

	if (loading && data.length === 0) {
		return <p>Memuat data awal...</p>;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-3xl font-bold">Manajemen Member</h2>
					<p className="text-muted-foreground">
						Tambah, edit, atau hapus data member di sini.
					</p>
				</div>

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span tabIndex="0">
								<Button
									onClick={() => {
										setEditingMember(null);
										setIsDialogOpen(true);
									}}
									disabled={!isWilayahDataReady || loading}
								>
									<PlusCircle className="mr-2 h-4 w-4" /> Tambah Member
								</Button>
							</span>
						</TooltipTrigger>
						{!isWilayahDataReady && (
							<TooltipContent>
								<p>
									Harap konfigurasikan peta di halaman Pengaturan terlebih
									dahulu.
								</p>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>
			</div>

			{loading && (
				<p className="text-sm text-muted-foreground mb-2">
					Memperbarui data...
				</p>
			)}

			<DataTable columns={columns} data={data} />

			{/* Dialog untuk Tambah/Edit Member */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingMember ? "Edit Member" : "Tambah Member Baru"}
						</DialogTitle>
					</DialogHeader>
					{settings && (
						<MemberForm
							settings={settings}
							initialData={editingMember}
							onSave={handleSave}
							onCancel={() => setIsDialogOpen(false)}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* AlertDialog untuk Konfirmasi Hapus */}
			<AlertDialog
				open={!!deletingMember}
				onOpenChange={() => setDeletingMember(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
						<AlertDialogDescription>
							Aksi ini akan menghapus data member bernama "
							{deletingMember?.name}".
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default Manage;
