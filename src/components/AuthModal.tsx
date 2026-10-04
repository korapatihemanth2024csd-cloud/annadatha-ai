import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthCard } from "./AuthCard";
import { type ReactNode, useState } from "react";

interface AuthModalProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({ children, open: controlledOpen, onOpenChange, defaultMode = "signin" }: AuthModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 bg-background/95 backdrop-blur-2xl">
        <AuthCard initialMode={defaultMode} onSuccess={() => setOpen(false)} className="border-0 shadow-none bg-transparent" />
      </DialogContent>
    </Dialog>
  );
}
