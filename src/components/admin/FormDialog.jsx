import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const FormDialog = ({ open, onOpenChange, title, children }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/30 bg-background p-6 text-titlecolor shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Close className="text-mutedText/70 hover:text-white">
            <X size={18} />
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default FormDialog;
