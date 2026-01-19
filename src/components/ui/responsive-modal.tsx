import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ResponsiveModalContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface ResponsiveModalCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
}

// Create context to share mobile state
const ResponsiveModalContext = React.createContext<boolean>(false);

// Hook to use the responsive modal context
function useResponsiveModalContext() {
  return React.useContext(ResponsiveModalContext);
}

export function ResponsiveModal({ children, open, onOpenChange }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={true}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveModalContext.Provider>
    );
  }

  return (
    <ResponsiveModalContext.Provider value={false}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveModalContext.Provider>
  );
}

export function ResponsiveModalTrigger({ children, asChild }: ResponsiveModalTriggerProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
}

export function ResponsiveModalContent({ children, className }: ResponsiveModalContentProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        {children}
      </DrawerContent>
    );
  }

  return <DialogContent className={className}>{children}</DialogContent>;
}

export function ResponsiveModalHeader({ children, className }: ResponsiveModalHeaderProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

export function ResponsiveModalFooter({ children, className }: ResponsiveModalFooterProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

export function ResponsiveModalTitle({ children, className }: ResponsiveModalTitleProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveModalDescription({ children, className }: ResponsiveModalDescriptionProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

export function ResponsiveModalClose({ children, asChild }: ResponsiveModalCloseProps) {
  const isMobile = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
  }

  return <DialogClose asChild={asChild}>{children}</DialogClose>;
}
