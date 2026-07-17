"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit?: string;
}

interface WorkOrderInventoryItem {
  id: string;
  quantity: number;
  notes?: string;
  inventoryItem: InventoryItem;
}

interface Props {
  workOrderId: string;
  locale: string;
}

export function WorkOrderInventory({ workOrderId, locale }: Props) {
  const t = useTranslations("WorkOrders");
  const isRtl = locale === "ar";
  const [items, setItems] = useState<WorkOrderInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/inventory`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error("Expected array, got", data);
        setItems([]);
        toast.error(t("fetchInventoryError"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("fetchInventoryError"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [workOrderId, t]);

  const fetchAvailableItems = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch("/api/inventory?inStock=true");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableItems(data);
      } else {
        console.error("Expected array, got", data);
        setAvailableItems([]);
        toast.error(t("fetchInventoryError"));
      }
    } catch (error) {
      console.error(error);
      setAvailableItems([]);
      toast.error(t("fetchInventoryError"));
    } finally {
      setLoadingAvailable(false);
    }
  }, [t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openAddDialog = async () => {
    await fetchAvailableItems();
    setSelectedItemId("");
    setQuantity(1);
    setNotes("");
    setDialogOpen(true);
  };

  const handleAdd = async () => {
    if (!selectedItemId) {
      toast.error(t("selectItem"));
      return;
    }
    if (quantity <= 0) {
      toast.error(t("invalidQuantity"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId: selectedItemId, quantity, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("addError"));
      }
      toast.success(t("itemAdded"));
      setDialogOpen(false);
      await fetchItems();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف هذه القطعة؟" : "Are you sure you want to remove this item?")) return;
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/inventory?recordId=${recordId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(t("itemRemoved"));
      await fetchItems();
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setQuantity(value > 0 ? value : 1);
  };

  if (loading) return <div className="py-4 text-center"><Loader2 className="animate-spin h-6 w-6 inline" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{t("spareParts")}</h3>
        <Button onClick={openAddDialog} size="sm" className="rounded-full gap-1">
          <Plus size={16} /> {t("addPart")}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noPartsUsed")}</p>
      ) : (
        <div className="border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center">{t("itemName")}</TableHead>
                <TableHead className="text-center">{t("sku")}</TableHead>
                <TableHead className="text-center">{t("quantity")}</TableHead>
                <TableHead className="text-center">{t("notes")}</TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-center">
                    {item.inventoryItem.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-center">
                    {item.inventoryItem.sku}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity} {item.inventoryItem.unit || ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center">
                    {item.notes || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addSparePart")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("item")}</Label>
              {loadingAvailable ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5" /></div>
              ) : availableItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noItemsAvailable")}</p>
              ) : (
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectItem")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex flex-col items-start">
                          <span>{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.sku} - {t("availableQuantity")}: {item.quantity} {item.unit || ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>{t("quantity")}</Label>
              <Input type="number" min={1} value={quantity} onChange={handleQuantityChange} />
            </div>
            <div>
              <Label>{t("notes")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleAdd} disabled={submitting || !selectedItemId}>
              {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              {t("add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}