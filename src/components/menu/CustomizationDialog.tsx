
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useState, useMemo } from 'react';
import type { MenuItem, Spiciness, SugarLevel, Topping } from '@/lib/types';
import { useOrder } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus } from 'lucide-react';

interface CustomizationDialogProps {
  menuItem: MenuItem;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export function CustomizationDialog({ menuItem, isOpen, setIsOpen }: CustomizationDialogProps) {
  const { addToOrder } = useOrder();
  const [quantity, setQuantity] = useState(1);
  const [selectedSpiciness, setSelectedSpiciness] = useState<Spiciness | undefined>(menuItem.customizations.spiciness?.[0]);
  const [selectedSugarLevel, setSelectedSugarLevel] = useState<SugarLevel | undefined>(menuItem.customizations.sugarLevels?.[1] || 'Normal');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);

  const handleAddTopping = (topping: Topping) => {
    setSelectedToppings(prev =>
      prev.some(t => t.id === topping.id) ? prev.filter(t => t.id !== topping.id) : [...prev, topping]
    );
  };

  const totalPrice = useMemo(() => {
    const toppingsPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    return (menuItem.price + toppingsPrice) * quantity;
  }, [menuItem.price, selectedToppings, quantity]);

  const handleConfirm = () => {
    addToOrder(menuItem, quantity, { spiciness: selectedSpiciness, sugarLevel: selectedSugarLevel, toppings: selectedToppings });
    setIsOpen(false);
    // Reset state for next time
    setQuantity(1);
    setSelectedSpiciness(menuItem.customizations.spiciness?.[0]);
    setSelectedSugarLevel(menuItem.customizations.sugarLevels?.[1] || 'Normal');
    setSelectedToppings([]);
  };

  const sugarLevelLabels: Record<SugarLevel, string> = {
    'Less Sugar': 'Rendah Gula',
    'Normal': 'Normal',
    'Extra Sugar': 'Tambah Gula',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{menuItem.name}</DialogTitle>
          <DialogDescription>{menuItem.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {menuItem.customizations.spiciness && menuItem.customizations.spiciness.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Tingkat Kepedasan</h4>
              <RadioGroup value={selectedSpiciness} onValueChange={(value: Spiciness) => setSelectedSpiciness(value)}>
                <div className="flex flex-wrap gap-4">
                  {menuItem.customizations.spiciness.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={`spiciness-${level}`} />
                      <Label htmlFor={`spiciness-${level}`}>{level}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}
          {menuItem.customizations.sugarLevels && menuItem.customizations.sugarLevels.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Tingkat Kemanisan</h4>
              <RadioGroup value={selectedSugarLevel} onValueChange={(value: SugarLevel) => setSelectedSugarLevel(value)}>
                <div className="flex flex-wrap gap-4">
                  {menuItem.customizations.sugarLevels.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={`sugar-${level}`} />
                      <Label htmlFor={`sugar-${level}`}>{sugarLevelLabels[level]}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}
          {menuItem.customizations.toppings && menuItem.customizations.toppings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Tambah Topping</h4>
              <div className="space-y-2">
                {menuItem.customizations.toppings.map(topping => (
                  <div key={topping.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`topping-${topping.id}`}
                        onCheckedChange={() => handleAddTopping(topping)}
                        checked={selectedToppings.some(t => t.id === topping.id)}
                      />
                      <Label htmlFor={`topping-${topping.id}`}>{topping.name}</Label>
                    </div>
                    <span className="text-sm text-muted-foreground">+{formatRupiah(topping.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Jumlah</h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-bold">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
            Tambah ke Pesanan - {formatRupiah(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
