"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { LookupItem, LookupFeatures } from "./types";
import { DEFAULT_LOOKUP_COLOR } from "./constants";

interface LookupDialogProps {
  open: boolean;
  item?: LookupItem | null;
  features: LookupFeatures;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LookupItem) => void;
}

export function LookupDialog({
  open,
  item,
  features,
  loading = false,
  onOpenChange,
  onSubmit,
}: LookupDialogProps) {

  const t = useTranslations("Settings");

  const schema = z.object({
    name: z
      .string()
      .min(1, t("validation.required"))
      .max(100, t("validation.maxLength")),

    nameEn: z.string().optional(),

    code: z.string().optional(),

    color: z.string().optional(),

    order: z.coerce
      .number()
      .min(1, t("validation.minOrder")),

    isDefault: z.boolean(),

    isActive: z.boolean(),
  });


  type FormValues = z.infer<typeof schema>;


  const form = useForm<FormValues>({
    resolver: zodResolver(schema),

    defaultValues: {
      name: "",
      nameEn: "",
      code: "",
      color: DEFAULT_LOOKUP_COLOR,
      order: 1,
      isDefault: false,
      isActive: true,
    },
  });


  useEffect(() => {

    if (!open) return;


    if (item) {

      form.reset({
        name: item.name,
        nameEn: item.nameEn ?? "",
        code: item.code ?? "",
        color: item.color ?? DEFAULT_LOOKUP_COLOR,
        order: item.order,
        isDefault: item.isDefault,
        isActive: item.isActive,
      });


    } else {

      form.reset({
        name: "",
        nameEn: "",
        code: "",
        color: DEFAULT_LOOKUP_COLOR,
        order: 1,
        isDefault: false,
        isActive: true,
      });

    }

  }, [open, item, form]);



  const handleSubmit = (values: FormValues) => {

    onSubmit({

      id: item?.id ?? "",

      name: values.name,

      nameEn: values.nameEn,

      code: values.code,

      color: values.color,

      order: values.order,

      isDefault: values.isDefault,

      isActive: values.isActive,

    });

  };



  return (

    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent className="sm:max-w-xl">

        <DialogHeader>

          <DialogTitle>

            {item ? t("editRecord") : t("addRecord")}

          </DialogTitle>


          <DialogDescription>

            {item
              ? t("editRecordDescription")
              : t("addRecordDescription")}

          </DialogDescription>

        </DialogHeader>



        <Form {...form}>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >


            <FormField

              control={form.control}

              name="name"

              render={({ field }) => (

                <FormItem>

                  <FormLabel>
                    {t("arabicName")}
                  </FormLabel>

                  <FormControl>

                    <Input
                      {...field}
                      autoFocus
                    />

                  </FormControl>

                  <FormMessage />

                </FormItem>

              )}

            />



            {features.enableEnglishName && (

              <FormField

                control={form.control}

                name="nameEn"

                render={({ field }) => (

                  <FormItem>

                    <FormLabel>
                      {t("englishName")}
                    </FormLabel>

                    <FormControl>

                      <Input {...field} />

                    </FormControl>

                    <FormMessage />

                  </FormItem>

                )}

              />

            )}



            {features.enableCode && (

              <FormField

                control={form.control}

                name="code"

                render={({ field }) => (

                  <FormItem>

                    <FormLabel>
                      {t("code")}
                    </FormLabel>

                    <FormControl>

                      <Input {...field} />

                    </FormControl>

                    <FormMessage />

                  </FormItem>

                )}

              />

            )}



            {features.enableColor && (

              <FormField

                control={form.control}

                name="color"

                render={({ field }) => (

                  <FormItem>

                    <FormLabel>
                      {t("color")}
                    </FormLabel>


                    <FormControl>

                      <div className="flex items-center gap-3">

                        <Input

                          type="color"

                          className="h-11 w-16 cursor-pointer p-1"

                          value={field.value}

                          onChange={field.onChange}

                        />


                        <Input

                          value={field.value}

                          onChange={field.onChange}

                          placeholder="#2563EB"

                        />

                      </div>

                    </FormControl>


                    <FormMessage />

                  </FormItem>

                )}

              />

            )}



            <FormField

              control={form.control}

              name="order"

              render={({ field }) => (

                <FormItem>

                  <FormLabel>
                    {t("order")}
                  </FormLabel>


                  <FormControl>

                    <Input
                      type="number"
                      min={1}
                      {...field}
                    />

                  </FormControl>


                  <FormMessage />

                </FormItem>

              )}

            />



            {features.enableDefault && (

              <FormField

                control={form.control}

                name="isDefault"

                render={({ field }) => (

                  <FormItem className="flex items-center justify-between rounded-lg border p-4">

                    <div>

                      <FormLabel>
                        {t("default")}
                      </FormLabel>

                    </div>


                    <FormControl>

                      <Switch

                        checked={field.value}

                        onCheckedChange={field.onChange}

                      />

                    </FormControl>


                  </FormItem>

                )}

              />

            )}



            {features.enableActive && (

              <FormField

                control={form.control}

                name="isActive"

                render={({ field }) => (

                  <FormItem className="flex items-center justify-between rounded-lg border p-4">

                    <FormLabel>
                      {t("status")}
                    </FormLabel>


                    <FormControl>

                      <Switch

                        checked={field.value}

                        onCheckedChange={field.onChange}

                      />

                    </FormControl>


                  </FormItem>

                )}

              />

            )}



            <DialogFooter>

              <Button

                type="button"

                variant="outline"

                onClick={() => onOpenChange(false)}

              >

                {t("cancel")}

              </Button>


              <Button

                type="submit"

                disabled={loading}

              >

                {loading
                  ? t("saving")
                  : item
                  ? t("saveChanges")
                  : t("create")}

              </Button>

            </DialogFooter>


          </form>

        </Form>


      </DialogContent>


    </Dialog>

  );

}