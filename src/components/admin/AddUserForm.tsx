
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { accessRules } from "@/lib/access-rules";
import { logActivity } from "@/lib/activity-log";

const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(accessRules.roles as [string, ...string[]], { required_error: "Peran wajib dipilih" }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface AddUserFormProps {
  onFormSubmit?: () => void;
}

export function AddUserForm({ onFormSubmit }: AddUserFormProps) {
  const { toast } = useToast();
  const { user, createUser } = useAuth();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "Cashier",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      await createUser(data.email, data.password, data.name, data.role);
      logActivity(user, `Membuat pengguna baru: ${data.name} (${data.role})`);
      toast({
        title: "Sukses!",
        description: `Akun untuk ${data.name} dengan peran ${data.role} telah berhasil dibuat.`,
      });
      if (onFormSubmit) {
        onFormSubmit();
      }
      form.reset();
    } catch (error: any) {
      console.error("Gagal membuat pengguna:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.code === 'auth/email-already-in-use' ? "Email ini sudah terdaftar. Gunakan email lain." : "Gagal membuat akun. Silakan coba lagi.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="cth., Budi Santoso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="cth., budi@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Minimal 6 karakter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Peran (Role)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih peran untuk pengguna baru" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {accessRules.roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Membuat Akun..." : "Buat Akun Baru"}
        </Button>
      </form>
    </Form>
  );
}
