import { AtSign, Building2, FileText, Phone, Store } from "lucide-react";
import { useEffect, useState } from "react";

import { FormField, SelectField, TextAreaField } from "../PartnerFormPrimitives";
import { BUSINESS_TYPES } from "../../data/partner-shop-mock";
import type { ShopEditableFields } from "../../context/PartnerShopContext";
import { ShopSheet } from "./ShopSheet";

type Errors = Partial<Record<keyof ShopEditableFields, string>>;

/** Edit sheet — shop name, description, contact, email, GST, business type. */
export function ShopEditSheet({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ShopEditableFields;
  onClose: () => void;
  onSave: (next: ShopEditableFields) => void;
}) {
  const [form, setForm] = useState<ShopEditableFields>(initial);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof ShopEditableFields>(key: K, value: ShopEditableFields[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Shop name needs at least 2 characters";
    if (form.description.trim().length > 0 && form.description.trim().length < 5) next.description = "Add at least 5 characters";
    if (form.contactNumber.trim() && !/^\+?\d{10,13}$/.test(form.contactNumber.replace(/[\s-]/g, "")))
      next.contactNumber = "Enter a valid phone number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";

    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      gstNumber: form.gstNumber.trim().toUpperCase(),
    });
  };

  return (
    <ShopSheet
      open={open}
      title="Edit Shop Details"
      subtitle="Update your store information visible to customers"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border bg-card py-3 text-sm font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="ripple flex-1 rounded-2xl bg-primary py-3 text-sm font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.97]"
          >
            Save Changes
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField
          id="shop-name"
          label="Shop Name"
          icon={Store}
          value={form.name}
          error={errors.name}
          onChange={(event) => set("name", event.target.value)}
        />
        <TextAreaField
          id="shop-description"
          label="Description"
          value={form.description}
          error={errors.description}
          placeholder="Tell customers what makes your shop different"
          onChange={(value) => set("description", value)}
        />
        <FormField
          id="shop-contact"
          label="Contact Number"
          icon={Phone}
          prefix="+91"
          inputMode="numeric"
          value={form.contactNumber}
          error={errors.contactNumber}
          onChange={(event) => set("contactNumber", event.target.value)}
        />
        <FormField
          id="shop-email"
          label="Email"
          icon={AtSign}
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => set("email", event.target.value)}
        />
        <FormField
          id="shop-gst"
          label="GST Number"
          icon={FileText}
          value={form.gstNumber}
          error={errors.gstNumber}
          hint="15-character GSTIN"
          onChange={(event) => set("gstNumber", event.target.value)}
        />
        <SelectField
          id="shop-business-type"
          label="Business Type"
          icon={Building2}
          value={form.businessType}
          error={errors.businessType}
          options={BUSINESS_TYPES}
          onChange={(value) => set("businessType", value)}
        />
      </div>
    </ShopSheet>
  );
}
