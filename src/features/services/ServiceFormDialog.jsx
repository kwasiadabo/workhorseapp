import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cleanPayload } from "@/lib/forms";
import useAuthStore from "@/store/authStore";
import { isCarBusiness } from "@/lib/businessTypes";
import { useServiceCategories } from "./useServiceCategories";
import { useCreateService, useUpdateService } from "./useServices";
import { useVehicleTypes } from "@/features/bookings/useVehicleTypes";

const serviceSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1 minute")
    .max(1440),
  price: z.coerce.number().min(0, "Must be 0 or more").optional().default(0),
  currency: z
    .string()
    .length(3, "Use a 3-letter currency code")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  vehiclePrices: z.record(z.string(), z.coerce.number().min(0)).optional(),
});

const buildVehiclePriceMap = (vehiclePrices) =>
  Object.fromEntries((vehiclePrices ?? []).map((vp) => [vp.vehicleTypeId, Number(vp.price)]));

const DEFAULT_VALUES = {
  categoryId: "none",
  name: "",
  description: "",
  durationMinutes: 30,
  price: 0,
  currency: "GH¢",
  isActive: true,
  vehiclePrices: {},
};

export default function ServiceFormDialog({ open, onOpenChange, service }) {
  const isEditing = Boolean(service);
  const businessType = useAuthStore((s) => s.user?.businessType);
  const isCarWash = isCarBusiness(businessType);

  const { data: categoriesData } = useServiceCategories({ limit: 100 });
  const categories = categoriesData?.data ?? [];

  const { data: vehicleTypesData } = useVehicleTypes(
    { limit: 100, sort: "displayOrder" },
    { enabled: isCarWash }
  );
  const vehicleTypes = vehicleTypesData?.data ?? [];

  const createService = useCreateService();
  const updateService = useUpdateService();
  const isPending = createService.isPending || updateService.isPending;

  const form = useForm({
    resolver: zodResolver(serviceSchema),
    values: service
      ? {
          categoryId: service.categoryId ?? "none",
          name: service.name ?? "",
          description: service.description ?? "",
          durationMinutes: service.durationMinutes ?? 30,
          price: service.price ?? 0,
          currency: service.currency ?? "GH¢",
          isActive: service.isActive ?? true,
          vehiclePrices: buildVehiclePriceMap(service.vehiclePrices),
        }
      : DEFAULT_VALUES,
  });

  const vehiclePriceValues = useWatch({ control: form.control, name: "vehiclePrices" }) ?? {};
  const currency = useWatch({ control: form.control, name: "currency" }) || "GH¢";

  useEffect(() => {
    if (open && !isEditing) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, isEditing, form]);

  const onSubmit = (values) => {
    const payload = cleanPayload(values);
    payload.categoryId =
      values.categoryId === "none" ? null : values.categoryId;

    if (isCarWash && vehicleTypes.length > 0) {
      payload.vehiclePrices = vehicleTypes.map((vt) => ({
        vehicleTypeId: vt.id,
        price: values.vehiclePrices?.[vt.id] ?? 0,
      }));
      delete payload.price;
    } else {
      delete payload.vehiclePrices;
    }

    const mutation = isEditing ? updateService : createService;
    const args = isEditing ? { id: service.id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        toast.success(isEditing ? "Service updated" : "Service created");
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(error?.response?.data?.message ?? "Unable to save service"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit service" : "Add service"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this service."
              : "Create a new service clients can book."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category">
                          {(value) =>
                            value === "none"
                              ? "No category"
                              : (categories.find(
                                  (category) => category.id === value,
                                )?.name ?? "Select a category")
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className={`grid gap-4 ${isCarWash ? "grid-cols-2" : "grid-cols-3"}`}>
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isCarWash && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input maxLength={3} className="uppercase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isCarWash && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Price by vehicle type</p>
                {vehicleTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No vehicle types configured. Add them under Vehicle Types first.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {vehicleTypes.map((vt) => (
                      <div
                        key={vt.id}
                        className="rounded-lg border bg-muted/40 px-3 pt-2.5 pb-3 space-y-1.5"
                      >
                        <p className="text-[11px] font-medium text-muted-foreground leading-none truncate">
                          {vt.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground shrink-0">{currency}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 text-right tabular-nums text-sm px-2 min-w-0"
                            value={vehiclePriceValues[vt.id] ?? ""}
                            onChange={(e) =>
                              form.setValue(
                                `vehiclePrices.${vt.id}`,
                                e.target.value === "" ? 0 : Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
