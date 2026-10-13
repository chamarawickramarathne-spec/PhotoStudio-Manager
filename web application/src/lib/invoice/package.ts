import { formatDate } from "@/lib/format";

import type { InvoiceField } from "./types";

interface PackageBooking {
  event_type: string;
  package_name: string | null;
  shoot_type: string | null;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  album: string | null;
  wedding_date: string | null;
  wedding_hotel_name: string | null;
  homecoming_hotel_name: string | null;
  homecoming_date: string | null;
  wedding_album: boolean;
  pre_shoot_album: boolean;
  family_album: boolean;
  group_photo_size: string | null;
  homecoming_photo_size: string | null;
  wedding_photo_sizes: string[] | null;
  extra_thank_you_cards_qty: number | null;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function buildPackageFields(booking: PackageBooking): InvoiceField[] {
  const fields: InvoiceField[] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value == null) return;
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    fields.push({ label, value: trimmed });
  };

  add("Package", booking.package_name);
  add("Shoot Type", booking.shoot_type);

  if (booking.event_type === "Wedding") {
    add("Wedding Date", booking.wedding_date ? formatDate(booking.wedding_date) : null);
    add("Wedding Venue", booking.wedding_hotel_name);
    add("Homecoming Venue", booking.homecoming_hotel_name);
    add("Homecoming Date", booking.homecoming_date ? formatDate(booking.homecoming_date) : null);
    fields.push({ label: "Wedding Album", value: yesNo(booking.wedding_album) });
    fields.push({ label: "Pre-shoot Album", value: yesNo(booking.pre_shoot_album) });
    fields.push({ label: "Family Album", value: yesNo(booking.family_album) });
    add("Group Photo Size", booking.group_photo_size);
    add("Homecoming Size", booking.homecoming_photo_size);
    add(
      "Wedding Sizes",
      booking.wedding_photo_sizes?.length ? booking.wedding_photo_sizes.join(", ") : null,
    );
    add(
      "Extra Thank You Cards",
      booking.extra_thank_you_cards_qty ? String(booking.extra_thank_you_cards_qty) : null,
    );
  } else {
    add("Booking Date", booking.booking_date ? formatDate(booking.booking_date) : null);
    add("Time", [booking.start_time, booking.end_time].filter(Boolean).join(" - ") || null);
    add("Location", booking.location);
    add("Album", booking.album);
  }

  return fields;
}
