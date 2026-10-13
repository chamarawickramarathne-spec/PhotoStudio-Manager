import { formatDate } from "@/lib/format";

import type { InvoiceField, InvoiceSection } from "./types";

export const EMPTY_VALUE = "\u2014";

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

function text(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : EMPTY_VALUE;
}

function date(value: string | null): string {
  return value ? formatDate(value) : EMPTY_VALUE;
}

function field(label: string, value: string, chip = false): InvoiceField {
  return chip ? { label, value, chip } : { label, value };
}

export function buildPackageSections(booking: PackageBooking): InvoiceSection[] {
  if (booking.event_type === "Wedding") {
    const sizes = booking.wedding_photo_sizes ?? [];
    return [
      {
        title: "Wedding Details",
        columns: 2,
        fields: [
          field("Wedding Date", date(booking.wedding_date)),
          field("Wedding Venue", text(booking.wedding_hotel_name)),
          field("Homecoming Venue", text(booking.homecoming_hotel_name)),
          field("Homecoming Date", date(booking.homecoming_date)),
        ],
      },
      {
        title: "Albums",
        columns: 3,
        fields: [
          field("Wedding Album", yesNo(booking.wedding_album), true),
          field("Pre-shoot Album", yesNo(booking.pre_shoot_album), true),
          field("Family Album", yesNo(booking.family_album), true),
        ],
      },
      {
        title: "Photo Sizes",
        columns: 3,
        fields: [
          field("Group Photo Size", text(booking.group_photo_size), true),
          field("Homecoming Photo Size", text(booking.homecoming_photo_size), true),
          field(
            "Extra Thank You Cards Qty",
            String(booking.extra_thank_you_cards_qty ?? 0),
            true,
          ),
          ...(sizes.length > 0
            ? [field("Wedding Photo Sizes", sizes.join(", "), true)]
            : []),
        ],
      },
      {
        title: "Package",
        columns: 2,
        fields: [
          field("Package", text(booking.package_name)),
          field("Shoot Type", text(booking.shoot_type)),
        ],
      },
    ];
  }

  return [
    {
      title: "Schedule",
      columns: 3,
      fields: [
        field("Booking Date", date(booking.booking_date)),
        field("Start Time", text(booking.start_time)),
        field("End Time", text(booking.end_time)),
        field("Location", text(booking.location)),
        field("Album", text(booking.album), true),
      ],
    },
    {
      title: "Package",
      columns: 2,
      fields: [
        field("Package", text(booking.package_name)),
        field("Shoot Type", text(booking.shoot_type)),
      ],
    },
  ];
}
