"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AddDrugPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        drugCode: String(formData.get("drugCode") || "").trim(),
        name: String(formData.get("name") || "").trim(),
        genericName: String(formData.get("genericName") || "").trim() || undefined,
        brandName: String(formData.get("brandName") || "").trim() || undefined,
        category: String(formData.get("category") || "").trim(),
        manufacturer: String(formData.get("manufacturer") || "").trim() || undefined,
        unit: String(formData.get("unit") || "tablet").trim(),
        description: String(formData.get("description") || "").trim() || undefined,
        dosageForm: String(formData.get("dosageForm") || "").trim() || undefined,
        strength: String(formData.get("strength") || "").trim() || undefined,
        requiresPrescription: String(formData.get("requiresPrescription") || "true") === "true",
        storageConditions: String(formData.get("storageConditions") || "").trim() || undefined,
        reorderLevel: Number(formData.get("reorderLevel") || 50),
        currentUnitPrice: Number(formData.get("currentUnitPrice") || 0),
        averageCost: Number(formData.get("averageCost") || 0),
        initialBatch: {
          batchNumber: String(formData.get("batchNumber") || "").trim() || undefined,
          expiryDate: String(formData.get("expiryDate") || "").trim() || undefined,
          initialQuantity: Number(formData.get("initialQuantity") || 0),
          unitCost: Number(formData.get("unitCost") || 0),
          supplier: String(formData.get("supplier") || "").trim() || undefined,
        },
      };

      const res = await fetch("/api/drugs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create drug");
      router.push(`/drugs/${json.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create drug");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Add New Drug</h1>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="drugCode" placeholder="Drug Code (e.g., DRG-001)" required />
            <Input name="name" placeholder="Drug Name" required />
            <Input name="genericName" placeholder="Generic Name" />
            <Input name="brandName" placeholder="Brand Name" />
            <Input name="category" placeholder="Category" required />
            <Input name="manufacturer" placeholder="Manufacturer" />
            <Input name="unit" placeholder="Unit (e.g., tablet, bottle)" defaultValue="tablet" required />
            <Input name="dosageForm" placeholder="Dosage Form (Tablet, Syrup, Injection)" />
            <Input name="strength" placeholder="Strength (e.g., 500mg)" />
            <Input name="reorderLevel" placeholder="Reorder Level" type="number" defaultValue={50} />
            <Input name="currentUnitPrice" placeholder="Unit Price" type="number" step="0.01" />
            <Input name="averageCost" placeholder="Average Cost" type="number" step="0.01" />
            <Textarea name="description" placeholder="Description" className="md:col-span-2" />
            <Input name="storageConditions" placeholder="Storage Conditions" className="md:col-span-2" />

            <div className="md:col-span-2 pt-4">
              <div className="font-medium mb-2">Initial Batch (optional)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input name="batchNumber" placeholder="Batch Number" />
                <Input name="expiryDate" placeholder="Expiry Date" type="date" />
                <Input name="supplier" placeholder="Supplier" />
                <Input name="initialQuantity" placeholder="Initial Quantity" type="number" />
                <Input name="unitCost" placeholder="Unit Cost" type="number" step="0.01" />
              </div>
            </div>

            {error && <div className="md:col-span-2 text-sm text-red-600">{error}</div>}
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Drug"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

