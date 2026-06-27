'use client';

/**
 * SupplierDialog — add new supplier via dialog.
 */

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createSupplierAction } from '@/actions/suppliers';

export function SupplierDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createSupplierAction({
        name: formData.get('name') as string,
        contactPerson: formData.get('contactPerson') as string || undefined,
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
        address: formData.get('address') as string || undefined,
        city: formData.get('city') as string || undefined,
        state: formData.get('state') as string || undefined,
        gstNumber: formData.get('gstNumber') as string || undefined,
      });
      toast.success('Supplier created');
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add Supplier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input name="contactPerson" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea name="address" rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input name="city" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input name="state" />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input name="gstNumber" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
