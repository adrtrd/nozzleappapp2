import { create } from 'zustand';
import { InvoicePrintView } from './InvoicePrintView';
import { InspectionPrintView } from './InspectionPrintView';

// ─── Global Print Store ────────────────────────────────────────────
interface PrintStore {
  isPrinting: boolean;
  printData: any | null;
  triggerPrint: (data: any) => void;
  clearPrint: () => void;
}

export const usePrintStore = create<PrintStore>((set) => ({
  isPrinting: false,
  printData: null,
  triggerPrint: (data) => {
    set({ isPrinting: true, printData: data });
    // Wait for render then print
    setTimeout(() => {
      window.print();
      // After dialog closes
      setTimeout(() => set({ isPrinting: false, printData: null }), 1000);
    }, 300);
  },
  clearPrint: () => set({ isPrinting: false, printData: null }),
}));

// ─── PrintProvider — renders invoice or inspection certificate ──────
export function PrintProvider() {
  const printData = usePrintStore((s) => s.printData);

  if (!printData) return null;

  return (
    <div id="INVOICE_PRINT_WRAPPER">
      {printData.type === 'inspection' ? (
        <InspectionPrintView
          id="INVOICE_PRINT"
          inspection={printData.inspection}
          car={printData.car}
          customer={printData.customer}
        />
      ) : (
        <InvoicePrintView
          id="INVOICE_PRINT"
          visit={printData.visit}
          customer={printData.customer}
          car={printData.car}
          services={printData.services}
          invoice={printData.invoice}
          settings={printData.settings}
        />
      )}
    </div>
  );
}
