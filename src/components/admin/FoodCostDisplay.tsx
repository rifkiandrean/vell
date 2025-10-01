
"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { MenuItem, InventoryItem, RecipeItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

const isValidUrl = (urlString: string) => {
    try { new URL(urlString); return true; } catch (e) { return false; }
};

// RecipeDialog component
function RecipeDialog({
  isOpen,
  setIsOpen,
  menuItem,
  inventory,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  menuItem: MenuItem;
  inventory: InventoryItem[];
  onSave: (recipe: RecipeItem[]) => void;
}) {
  const [recipe, setRecipe] = useState<RecipeItem[]>(menuItem.recipe || []);
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState(0);

  useEffect(() => {
    setRecipe(menuItem.recipe || []);
  }, [menuItem]);

  const addIngredient = () => {
    if (newIngredientId && newIngredientQuantity > 0) {
      setRecipe([...recipe, { ingredientId: newIngredientId, quantity: newIngredientQuantity }]);
      setNewIngredientId('');
      setNewIngredientQuantity(0);
    }
  };

  const removeIngredient = (ingredientId: string) => {
    setRecipe(recipe.filter(item => item.ingredientId !== ingredientId));
  };
  
  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setRecipe(recipe.map(item => item.ingredientId === ingredientId ? { ...item, quantity } : item));
  };

  const handleSave = () => {
    onSave(recipe);
    setIsOpen(false);
  };
  
  const getIngredientInfo = (id: string) => inventory.find(i => i.id === id);

  const availableInventory = useMemo(() => {
    const usedIngredientIds = new Set(recipe.map(item => item.ingredientId));
    return inventory.filter(item => !usedIngredientIds.has(item.id));
  }, [inventory, recipe]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] grid-rows-[auto_minmax(0,1fr)] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Atur Resep untuk {menuItem.name}</DialogTitle>
          <DialogDescription>
            Tambahkan bahan dari gudang dan tentukan kuantitas yang digunakan untuk membuat satu porsi produk ini.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh]">
          <div className="space-y-4 p-6">
            {/* Form to add new ingredient */}
            <div className="flex gap-2 items-end">
              <div className="flex-grow">
                  <label className="text-sm font-medium">Bahan</label>
                  <Select value={newIngredientId} onValueChange={setNewIngredientId}>
                  <SelectTrigger><SelectValue placeholder="Pilih bahan" /></SelectTrigger>
                  <SelectContent>
                      {availableInventory.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name} ({item.unit})</SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>
              <div>
                  <label className="text-sm font-medium">Jumlah</label>
                  <Input
                  type="number"
                  placeholder="Jumlah"
                  value={newIngredientQuantity || ''}
                  onChange={(e) => setNewIngredientQuantity(parseFloat(e.target.value) || 0)}
                  />
              </div>
              <Button onClick={addIngredient} size="icon"><PlusCircle className="h-4 w-4" /></Button>
            </div>
            
            <Separator className="my-4" />

            {/* List of current ingredients */}
            <div className="space-y-2">
              <h4 className="font-medium">Bahan Saat Ini</h4>
              {recipe.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada bahan yang ditambahkan.</p> : null}
              {recipe.map(item => {
                const ingredientInfo = getIngredientInfo(item.ingredientId);
                return (
                <div key={item.ingredientId} className="flex gap-2 items-center">
                  <span className="flex-grow">{ingredientInfo?.name || 'Unknown'} ({ingredientInfo?.unit || 'N/A'})</span>
                  <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateIngredientQuantity(item.ingredientId, parseFloat(e.target.value))}
                      className="w-24 h-8"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeIngredient(item.ingredientId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )})}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-0">
            <Button onClick={handleSave}>Simpan Resep</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// Main Display Component
export function FoodCostDisplay() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
      setIsLoading(false);
    });
    const unsubInventory = onSnapshot(collection(db, 'gudang'), (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    });
    return () => {
      unsubMenu();
      unsubInventory();
    };
  }, []);

  const handleOpenDialog = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsDialogOpen(true);
  };
  
  const handleSaveRecipe = async (recipe: RecipeItem[]) => {
    if (!selectedMenuItem) return;
    try {
        const menuItemRef = doc(db, 'menu', selectedMenuItem.id);
        await updateDoc(menuItemRef, { recipe });
        toast({ title: "Sukses", description: "Resep telah diperbarui."});
    } catch (error) {
        console.error("Gagal menyimpan resep:", error);
        toast({ title: "Error", description: "Gagal menyimpan resep.", variant: "destructive" });
    }
  };

  const inventoryPriceMap = useMemo(() => {
    return new Map(inventory.map(item => [item.id, item.price || 0]));
  }, [inventory]);

  const calculateRecipeCost = (recipe: RecipeItem[] = []) => {
    return recipe.reduce((total, item) => {
      const price = inventoryPriceMap.get(item.ingredientId) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Menu & Food Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Gambar</TableHead>
                <TableHead>Nama Menu</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>HPP Resep</TableHead>
                <TableHead>Food Cost %</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Memuat data...</TableCell></TableRow>
              ) : (
                menuItems.map((item) => {
                  const recipeCost = calculateRecipeCost(item.recipe);
                  const foodCostPercentage = item.price > 0 ? (recipeCost / item.price) * 100 : 0;
                  const imageUrl = isValidUrl(item.image) ? item.image : '';

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden">
                          {imageUrl && <Image src={imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatRupiah(item.price)}</TableCell>
                      <TableCell>{formatRupiah(recipeCost)}</TableCell>
                      <TableCell className={foodCostPercentage > 35 ? 'text-red-500 font-bold' : ''}>
                        {foodCostPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
                          Atur Resep
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedMenuItem && (
        <RecipeDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          menuItem={selectedMenuItem}
          inventory={inventory}
          onSave={handleSaveRecipe}
        />
      )}
    </>
  );
}

    