
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activity-log";

const expenseSchema = z.object({
  name: z.string().min(1, "Nama beban wajib diisi"),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  date: z.date({ required_error: "Tanggal wajib diisi" }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface AddExpenseFormProps {
  expenseItem?: ExpenseItem;
  onFormSubmit?: () => void;
}

export function AddExpenseForm({ expenseItem, onFormSubmit }: AddExpenseFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!expenseItem;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (expenseItem) {
      form.reset({
        name: expenseItem.name,
        amount: expenseItem.amount,
        date: expenseItem.date.toDate(),
      });
    } else {
      form.reset({
        name: "",
        amount: 0,
        date: new Date(),
      });
    }
  }, [expenseItem, form]);


  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const dataToSave = { ...data };
      if (isEditMode) {
        const docRef = doc(db, "expenses", expenseItem.id);
        await updateDoc(docRef, dataToSave);
        logActivity(user, `Memperbarui beban: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Item beban telah diperbarui.",
        });
      } else {
        await addDoc(collection(db, "expenses"), dataToSave);
        logActivity(user, `Menambah beban baru: ${data.name}`);
        toast({
          title: "Sukses!",
          description: "Item beban baru telah ditambahkan.",
        });
      }
      
      if (onFormSubmit) {
        onFormSubmit();
      }
      if (!isEditMode) {
        form.reset();
      }
    } catch (error) {
      console.error("Gagal menyimpan dokumen: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan item beban. Silakan coba lagi.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Beban</FormLabel>
                  <FormControl>
                    <Input placeholder="cth., Gaji Karyawan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (IDR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="cth., 5000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Beban</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Tambah Item")}
        </Button>
      </form>
    </Form>
  );
}
