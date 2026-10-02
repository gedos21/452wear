"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { CheckboxField, Field, FormNote, SectionTitle } from "./field";
import {
  MAX_ADDRESSES,
  validateAddress,
  type Address,
  type AddressField,
  type AddressInput,
} from "@/lib/address";
import { accountApi } from "@/lib/account-api";

const EMPTY_FORM: AddressInput = {
  title: "",
  fullName: "",
  phone: "",
  city: "",
  district: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

type Mode = { kind: "list" } | { kind: "form"; editing: Address | null };

const BUTTON_PRIMARY =
  "inline-flex h-12 items-center rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-60";
const BUTTON_OUTLINE =
  "inline-flex h-12 items-center gap-2.5 rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60 disabled:opacity-60";
const TEXT_ACTION =
  "micro text-foreground/45 transition-colors hover:text-foreground disabled:opacity-60";

/** Adreslerim: kayıtlı adres kartları, ekle/düzenle formu, satır içi silme onayı. */
export function AddressesSection({ preview = false }: { preview?: boolean }) {
  const [addresses, setAddresses] = useState<Address[] | null>(preview ? [] : null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await accountApi<{ addresses: Address[] }>("GET", "/adresler");
    if (result.ok) setAddresses(result.data.addresses);
    else {
      setAddresses((prev) => prev ?? []);
      setNote(result.message);
    }
  }, []);

  useEffect(() => {
    // Önizlemede gerçek oturum yok; sunucuya gidilmez.
    if (preview) return;
    let active = true;
    accountApi<{ addresses: Address[] }>("GET", "/adresler").then((result) => {
      if (!active) return;
      if (result.ok) setAddresses(result.data.addresses);
      else {
        setAddresses([]);
        setNote(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, [preview]);

  if (mode.kind === "form") {
    return (
      <div>
        <SectionTitle>{mode.editing ? "ADRESİ DÜZENLE" : "YENİ ADRES"}</SectionTitle>
        <AddressForm
          editing={mode.editing}
          isFirst={(addresses?.length ?? 0) === 0}
          preview={preview}
          onCancel={() => setMode({ kind: "list" })}
          onSaved={async (message) => {
            await load();
            setMode({ kind: "list" });
            setNote(message);
          }}
        />
      </div>
    );
  }

  const full = (addresses?.length ?? 0) >= MAX_ADDRESSES;

  return (
    <div>
      <SectionTitle>ADRESLERİM</SectionTitle>

      {addresses === null ? (
        <div className="mt-8 h-40" aria-busy="true" />
      ) : addresses.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Kayıtlı adresin yok.</p>
      ) : (
        <ul className="mt-8 grid gap-4 xl:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => {
                setNote(null);
                setMode({ kind: "form", editing: address });
              }}
              onChanged={async (message) => {
                await load();
                setNote(message);
              }}
            />
          ))}
        </ul>
      )}

      {addresses !== null &&
        (full ? (
          <p className="mt-8 text-[13px] text-muted-foreground">
            En fazla {MAX_ADDRESSES} adres kaydedebilirsin. Yenisini eklemek için
            birini sil.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNote(null);
              setMode({ kind: "form", editing: null });
            }}
            className={`mt-8 ${BUTTON_OUTLINE}`}
          >
            <Plus className="size-4" strokeWidth={1.8} />
            Adres Ekle
          </button>
        ))}

      {note && <FormNote message={note} />}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onChanged,
}: {
  address: Address;
  onEdit: () => void;
  onChanged: (message: string | null) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function run(call: () => ReturnType<typeof accountApi>, success: string | null) {
    setPending(true);
    const result = await call();
    setPending(false);
    setConfirming(false);
    await onChanged(result.ok ? success : result.message);
  }

  return (
    <li className="flex flex-col rounded-product border border-border/70 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{address.title}</p>
        {address.isDefault && <span className="micro text-brand">Varsayılan</span>}
      </div>

      <div className="mt-3 space-y-1 text-[13px] leading-relaxed text-muted-foreground">
        <p className="text-foreground/80">{address.fullName}</p>
        <p>{address.addressLine}</p>
        <p>
          {address.district} / {address.city}
          {address.postalCode ? ` · ${address.postalCode}` : ""}
        </p>
        <p>{address.phone}</p>
      </div>

      {confirming ? (
        <div className="mt-5 border-t border-border/70 pt-4" role="group" aria-label="Silme onayı">
          <p className="text-[13px] text-foreground">Bu adres silinsin mi?</p>
          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => accountApi("DELETE", `/adresler/${address.id}`), "Adres silindi.")
              }
              className="micro text-brand transition-opacity hover:opacity-80 disabled:opacity-60"
            >
              Evet, Sil
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className={TEXT_ACTION}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border/70 pt-4">
          <button type="button" onClick={onEdit} disabled={pending} className={TEXT_ACTION}>
            Düzenle
          </button>
          {!address.isDefault && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => accountApi("POST", `/adresler/${address.id}/varsayilan`),
                  `"${address.title}" artık varsayılan adresin.`,
                )
              }
              className={TEXT_ACTION}
            >
              Varsayılan Yap
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(true)}
            className={TEXT_ACTION}
          >
            Sil
          </button>
        </div>
      )}
    </li>
  );
}

function AddressForm({
  editing,
  isFirst,
  preview,
  onCancel,
  onSaved,
}: {
  editing: Address | null;
  isFirst: boolean;
  preview: boolean;
  onCancel: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [form, setForm] = useState<AddressInput>(() =>
    editing
      ? { ...editing, postalCode: editing.postalCode ?? "", isDefault: false }
      : { ...EMPTY_FORM, title: isFirst ? "Ev" : "" },
  );
  const [error, setError] = useState<{ field?: AddressField; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const set = (key: AddressField) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error?.field === key) setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Önce aynı kurallarla burada kontrol: anında geri bildirim. Asıl kontrol sunucuda.
    const check = validateAddress(form);
    if (!check.ok) {
      setError({ field: check.field, message: check.message });
      return;
    }
    if (preview) {
      setError({ message: "Önizlemede adres kaydedilmez." });
      return;
    }

    setPending(true);
    const result = editing
      ? await accountApi("PATCH", `/adresler/${editing.id}`, form)
      : await accountApi("POST", "/adresler", form);
    setPending(false);

    if (!result.ok) {
      setError({ field: result.field as AddressField | undefined, message: result.message });
      return;
    }
    await onSaved(editing ? "Adres güncellendi." : "Adres kaydedildi.");
  }

  const invalid = (field: AddressField) => error?.field === field;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 max-w-md space-y-6">
      <Field
        label="Adres başlığı (ör. Ev, İş)"
        value={form.title}
        onChange={set("title")}
        maxLength={30}
        invalid={invalid("title")}
        required
      />
      <Field
        label="Ad Soyad"
        value={form.fullName}
        onChange={set("fullName")}
        autoComplete="name"
        maxLength={80}
        invalid={invalid("fullName")}
        required
      />
      <Field
        label="Telefon"
        type="tel"
        value={form.phone}
        onChange={set("phone")}
        autoComplete="tel"
        inputMode="tel"
        placeholder="0532 123 45 67"
        maxLength={25}
        invalid={invalid("phone")}
        required
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="İl"
          value={form.city}
          onChange={set("city")}
          autoComplete="address-level1"
          maxLength={40}
          invalid={invalid("city")}
          required
        />
        <Field
          label="İlçe"
          value={form.district}
          onChange={set("district")}
          autoComplete="address-level2"
          maxLength={40}
          invalid={invalid("district")}
          required
        />
      </div>
      <Field
        label="Adres (mahalle, sokak, no, daire)"
        value={form.addressLine}
        onChange={set("addressLine")}
        autoComplete="street-address"
        maxLength={250}
        invalid={invalid("addressLine")}
        required
      />
      <Field
        label="Posta kodu (isteğe bağlı)"
        value={form.postalCode}
        onChange={set("postalCode")}
        autoComplete="postal-code"
        inputMode="numeric"
        maxLength={5}
        invalid={invalid("postalCode")}
      />

      {!isFirst && !editing?.isDefault && (
        <CheckboxField
          label="Varsayılan adresim olsun"
          checked={form.isDefault}
          onChange={(isDefault) => setForm((prev) => ({ ...prev, isDefault }))}
        />
      )}

      <div className="flex items-center gap-5 pt-2">
        <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
          Kaydet
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className={TEXT_ACTION}>
          Vazgeç
        </button>
      </div>

      {error && <FormNote message={error.message} />}
    </form>
  );
}
