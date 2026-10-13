export interface InvoiceParty {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  logoDataUri?: string | null;
}

export interface InvoiceLine {
  label: string;
  type: string;
  dueDate?: string | null;
  status?: string | null;
  amount: number;
  paid: number;
}

export interface InvoiceField {
  label: string;
  value: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  currency: string;
  photographer: InvoiceParty;
  client: InvoiceParty;
  bookingTitle: string;
  eventType: string;
  bookingDate: string | null;
  package?: InvoiceField[] | null;
  lines: InvoiceLine[];
  total: number;
  paid: number;
  balance: number;
  notes?: string | null;
}
